import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { decodeHtmlEntities } from "@/lib/text-utils";
import {
  getMetaConfig,
  formatFacebookCaption,
  formatInstagramCaption,
  publishFacebookPhoto,
  publishToInstagramTwoStep,
  reconcileFacebookPhoto,
  reconcileInstagramMedia,
} from "@/lib/meta";
import { SocialPublicationInsert, SocialPublicationNetwork } from "@/types/social";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

interface AutomatedPublishRequestBody {
  news_id?: string;
  newsId?: string;
  title?: string;
  image_url?: string;
  imageUrl?: string;
  networks?: SocialPublicationNetwork[];
}

interface LegacyRequestBody {
  newsId: string;
  network: "facebook" | "instagram";
  action?: "publish" | "resolve_mark_published" | "resolve_retry" | "reconcile";
}

type CombinedRequestBody = AutomatedPublishRequestBody & Partial<LegacyRequestBody>;

export async function POST(req: NextRequest) {
  try {
    // 1. Validação de Autenticação do Administrador via JWT no Header Authorization
    const authHeader = req.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "Não autorizado: Cabeçalho Authorization com token Bearer é obrigatório." },
        { status: 401 }
      );
    }

    const token = authHeader.replace(/^Bearer\s+/i, "").trim();
    const supabaseAdmin = getSupabaseAdmin();

    const {
      data: { user },
      error: authError,
    } = await supabaseAdmin.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json(
        { error: "Sessão inválida ou expirada. Faça login novamente no painel administrativo." },
        { status: 401 }
      );
    }

    const isAdmin =
      user.email === "redenortedoparana@gmail.com" ||
      user.app_metadata?.role === "admin";

    if (!isAdmin) {
      return NextResponse.json(
        { error: "Acesso proibido: este usuário não possui privilégios de administrador." },
        { status: 403 }
      );
    }

    // 2. Leitura do Corpo da Requisição
    const body = (await req.json().catch(() => null)) as CombinedRequestBody | null;
    if (!body) {
      return NextResponse.json(
        { error: "Corpo da requisição JSON inválido ou vazio." },
        { status: 400 }
      );
    }

    // =========================================================================
    // ETAPA 2: FLUXO DE PUBLICAÇÃO AUTOMATIZADA (Carimbo Oficial RA + Meta via n8n)
    // Ativado quando o array de 'networks' é enviado pelo SocialPublishWidget
    // =========================================================================
    if (Array.isArray(body.networks) && body.networks.length > 0) {
      const newsId = (body.news_id || body.newsId)?.trim();
      const networks = body.networks;
      const customTitle = body.title?.trim();
      const customImageUrl = (body.image_url || body.imageUrl)?.trim();

      if (!newsId) {
        return NextResponse.json(
          { error: "Parâmetro obrigatório ausente: 'news_id'." },
          { status: 400 }
        );
      }

      // Validação de existência da matéria no Supabase
      const { data: news, error: fetchErr } = await supabaseAdmin
        .from("news")
        .select("id, titulo, resumo, conteudo, imagem, slug, status")
        .eq("id", newsId)
        .maybeSingle();

      if (fetchErr || !news) {
        return NextResponse.json(
          { error: "Notícia não encontrada no banco de dados para disparo." },
          { status: 404 }
        );
      }

      const finalTitle = decodeHtmlEntities(customTitle || news.titulo);
      const finalImageUrl = customImageUrl || news.imagem;

      // Inserção do registro inicial na tabela social_publications com status 'queued'
      const insertData: SocialPublicationInsert = {
        news_id: newsId,
        networks,
        status: "queued",
        canva_job_id: null,
        supabase_image_url: null,
        meta_post_ids: {},
        error_log: null,
      };

      const { data: newPublication, error: insertErr } = await supabaseAdmin
        .from("social_publications")
        .insert(insertData)
        .select()
        .single();

      if (insertErr || !newPublication) {
        console.error("Erro ao registrar publicação social no Supabase:", insertErr);
        return NextResponse.json(
          { error: `Erro ao enfileirar publicação no banco: ${insertErr?.message || "Falha desconhecida"}` },
          { status: 500 }
        );
      }

      // Disparo via fetch para o Webhook do n8n
      const rawEnvUrl = process.env.N8N_WEBHOOK_URL?.trim();
      const isPlaceholder =
        !rawEnvUrl ||
        rawEnvUrl === "COLE_AQUI_A_URL_DO_SEU_WEBHOOK" ||
        !rawEnvUrl.startsWith("http");

      // Monta lista de URLs prioritárias para disparar ao n8n
      const candidateUrls: string[] = [];
      if (rawEnvUrl && !isPlaceholder) {
        candidateUrls.push(rawEnvUrl);
        if (rawEnvUrl.includes("/webhook/social-publish")) {
          candidateUrls.push(rawEnvUrl.replace("/webhook/social-publish", "/webhook-test/social-publish"));
        }
      }
      candidateUrls.push("http://127.0.0.1:5678/webhook/social-publish");
      candidateUrls.push("http://localhost:5678/webhook/social-publish");
      candidateUrls.push("http://127.0.0.1:5678/webhook-test/social-publish");
      candidateUrls.push("http://localhost:5678/webhook-test/social-publish");

      const uniqueCandidateUrls = Array.from(new Set(candidateUrls));

      const n8nPayload = {
        publication_id: newPublication.id,
        news_id: newsId,
        title: finalTitle,
        image_url: finalImageUrl,
        resumo: news.resumo || "",
        conteudo: news.conteudo || "",
        slug: news.slug || "",
        networks,
        created_at: newPublication.created_at,
      };

      try {
        let n8nRes: Response | null = null;
        let lastErrorText = "";

        for (const url of uniqueCandidateUrls) {
          try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 12000);

            const res = await fetch(url, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "User-Agent": "RedeNortePro-NextJS/1.0",
              },
              body: JSON.stringify(n8nPayload),
              signal: controller.signal,
            });

            clearTimeout(timeoutId);

            if (res.ok) {
              n8nRes = res;
              break;
            } else if (res.status === 404 && uniqueCandidateUrls.length > 1) {
              lastErrorText = `Status 404 em ${url}`;
              continue;
            } else {
              const resBodyText = await res.text().catch(() => res.statusText);
              lastErrorText = `Webhook n8n (${url}) respondeu com erro (${res.status}): ${resBodyText || res.statusText}`;
              n8nRes = res;
              break;
            }
          } catch (fetchErr: any) {
            lastErrorText = fetchErr?.message || "Erro de rede";
          }
        }

        if (!n8nRes || !n8nRes.ok) {
          console.warn(`Webhook direto do n8n não respondeu (${lastErrorText || "offline"}). Publicação mantida na fila do Supabase com status 'queued' para processamento autônomo.`);
          return NextResponse.json({
            success: true,
            queued: true,
            message: "Publicação registrada na fila do Supabase com sucesso. O robô n8n processará o item automaticamente.",
            publication: newPublication,
          });
        }

        return NextResponse.json({
          success: true,
          message: "Publicação enfileirada com sucesso e disparada para o fluxo do n8n.",
          publication: newPublication,
        });
      } catch (n8nError: any) {
        console.warn("Disparo direto para o webhook do n8n falhou, mantendo publicação na fila do Supabase:", n8nError?.message);

        // A publicação já foi salva com status 'queued' no Supabase.
        // Como o site roda na nuvem (Vercel) e o n8n pode estar na máquina local,
        // não marcamos como falha, pois a automação consumirá a fila diretamente do Supabase.
        return NextResponse.json({
          success: true,
          queued: true,
          message: "Publicação registrada na fila do Supabase com sucesso. O robô n8n processará o item automaticamente.",
          publication: newPublication,
        });
      }
    }

    // =========================================================================
    // FLUXO LEGADO: PUBLICAÇÃO DIRETA META (FACEBOOK / INSTAGRAM AVULSO)
    // Mantido para compatibilidade estrita com botões e rotinas preexistentes
    // =========================================================================
    const newsId = body.newsId || body.news_id;
    const network = body.network;
    const action = body.action || "publish";

    if (!newsId || !network) {
      return NextResponse.json(
        { error: "Parâmetros obrigatórios ausentes: 'newsId'/'news_id' e 'network' ou 'networks'." },
        { status: 400 }
      );
    }

    if (network !== "facebook" && network !== "instagram") {
      return NextResponse.json(
        { error: "Rede inválida. Utilize 'facebook' ou 'instagram'." },
        { status: 400 }
      );
    }

    // 3. Ações Manuais do Administrador para Resolução de Pendências
    if (action === "resolve_mark_published") {
      const updateData =
        network === "facebook"
          ? {
              facebook_status: "publicado",
              facebook_published_at: new Date().toISOString(),
              facebook_error: null,
            }
          : {
              instagram_status: "publicado",
              instagram_published_at: new Date().toISOString(),
              instagram_error: null,
            };

      await supabaseAdmin.from("news").update(updateData).eq("id", newsId);
      return NextResponse.json({
        ok: true,
        message: `Status do ${network === "facebook" ? "Facebook" : "Instagram"} atualizado manualmente para 'publicado'.`,
      });
    }

    if (action === "resolve_retry") {
      const updateData =
        network === "facebook"
          ? {
              facebook_status: "nao_publicado",
              facebook_error: null,
            }
          : {
              instagram_status: "nao_publicado",
              instagram_container_id: null,
              instagram_error: null,
            };

      await supabaseAdmin.from("news").update(updateData).eq("id", newsId);
      return NextResponse.json({
        ok: true,
        message: `Status do ${network === "facebook" ? "Facebook" : "Instagram"} liberado para nova tentativa.`,
      });
    }

    // 4. Busca da Notícia no Banco
    const { data: news, error: fetchError } = await supabaseAdmin
      .from("news")
      .select(
        "id, titulo, status, resumo, conteudo, imagem, slug, facebook_status, facebook_attempted_at, instagram_status, instagram_attempted_at, instagram_container_id"
      )
      .eq("id", newsId)
      .maybeSingle();

    if (fetchError || !news) {
      return NextResponse.json({ error: "Notícia não encontrada no banco de dados." }, { status: 404 });
    }

    // Ação de Reconciliação Avulsa
    if (action === "reconcile") {
      const metaConfig = getMetaConfig();
      if (network === "facebook") {
        const attemptedAt = news.facebook_attempted_at
          ? new Date(news.facebook_attempted_at)
          : new Date(Date.now() - 3600_000);
        const rec = await reconcileFacebookPhoto(metaConfig, attemptedAt, news.titulo);
        if (rec.found && rec.postId) {
          await supabaseAdmin
            .from("news")
            .update({
              facebook_status: "publicado",
              facebook_post_id: rec.postId,
              facebook_published_at: rec.publishedAt || new Date().toISOString(),
              facebook_error: null,
            })
            .eq("id", newsId);
          return NextResponse.json({ ok: true, status: "publicado", postId: rec.postId });
        }
        return NextResponse.json({ ok: true, status: rec.error ? "incerto" : "nao_encontrado", error: rec.error });
      } else {
        const attemptedAt = news.instagram_attempted_at
          ? new Date(news.instagram_attempted_at)
          : new Date(Date.now() - 3600_000);
        const rec = await reconcileInstagramMedia(
          metaConfig,
          news.instagram_container_id || null,
          attemptedAt,
          news.titulo
        );
        if (rec.found && rec.mediaId) {
          await supabaseAdmin
            .from("news")
            .update({
              instagram_status: "publicado",
              instagram_media_id: rec.mediaId,
              instagram_published_at: rec.publishedAt || new Date().toISOString(),
              instagram_error: null,
            })
            .eq("id", newsId);
          return NextResponse.json({ ok: true, status: "publicado", mediaId: rec.mediaId });
        }
        return NextResponse.json({ ok: true, status: rec.error ? "incerto" : "nao_encontrado", error: rec.error });
      }
    }

    // 5. Validações Prévias da Notícia
    if (news.status !== "published") {
      return NextResponse.json(
        {
          error:
            "Apenas notícias publicadas no portal (com status 'published') podem ser enviadas para o Facebook ou Instagram.",
        },
        { status: 400 }
      );
    }

    const imageUrl = news.imagem?.trim();
    if (!imageUrl || !imageUrl.startsWith("https://")) {
      const errMsg =
        "A notícia precisa ter uma imagem de capa pública com protocolo seguro HTTPS (https://). Imagens locais ou em Base64 não são aceitas pela Meta.";
      return NextResponse.json({ error: errMsg }, { status: 400 });
    }

    const currentStatus = network === "facebook" ? news.facebook_status : news.instagram_status;
    const attemptedAtStr = network === "facebook" ? news.facebook_attempted_at : news.instagram_attempted_at;

    if (currentStatus === "publicado") {
      return NextResponse.json(
        { error: `Esta notícia já foi publicada no ${network === "facebook" ? "Facebook" : "Instagram"}.` },
        { status: 400 }
      );
    }

    if (currentStatus === "incerto") {
      return NextResponse.json(
        {
          error: `O status da notícia está 'incerto'. É necessário verificar no ${
            network === "facebook" ? "Facebook" : "Instagram"
          } e resolver manualmente no painel antes de reenviar.`,
        },
        { status: 409 }
      );
    }

    // 6. Blindagem de Reconciliação Obrigatória após 5 minutos
    if (currentStatus === "publicando") {
      const tempoDecorridoMs = attemptedAtStr ? Date.now() - new Date(attemptedAtStr).getTime() : 0;
      const cincoMinutosMs = 5 * 60 * 1000;

      if (tempoDecorridoMs < cincoMinutosMs) {
        return NextResponse.json(
          {
            error: "Publicação já em andamento. Aguarde alguns instantes até a conclusão do processo.",
          },
          { status: 409 }
        );
      }

      const metaConfig = getMetaConfig();
      const attemptedDate = attemptedAtStr ? new Date(attemptedAtStr) : new Date(Date.now() - cincoMinutosMs);

      if (network === "facebook") {
        const rec = await reconcileFacebookPhoto(metaConfig, attemptedDate, news.titulo);
        if (rec.found && rec.postId) {
          await supabaseAdmin
            .from("news")
            .update({
              facebook_status: "publicado",
              facebook_post_id: rec.postId,
              facebook_published_at: rec.publishedAt || new Date().toISOString(),
              facebook_error: null,
            })
            .eq("id", newsId);

          return NextResponse.json({
            success: true,
            network: "facebook",
            postId: rec.postId,
            reconciled: true,
            message: "Publicação prévia recuperada e confirmada na Página do Facebook.",
          });
        }

        if (rec.error) {
          await supabaseAdmin
            .from("news")
            .update({
              facebook_status: "incerto",
              facebook_error: `Publicação interrompida há mais de 5 minutos e reconciliação inconclusiva (${rec.error}). Verifique no Facebook antes de reenviar.`,
            })
            .eq("id", newsId);

          return NextResponse.json(
            {
              error:
                "Status incerto: verificação na Meta Graph API falhou. Verifique na Página do Facebook antes de reenviar.",
              status: "incerto",
            },
            { status: 500 }
          );
        }
      } else {
        const rec = await reconcileInstagramMedia(
          metaConfig,
          news.instagram_container_id || null,
          attemptedDate,
          news.titulo
        );

        if (rec.found && rec.mediaId) {
          await supabaseAdmin
            .from("news")
            .update({
              instagram_status: "publicado",
              instagram_media_id: rec.mediaId,
              instagram_published_at: rec.publishedAt || new Date().toISOString(),
              instagram_error: null,
            })
            .eq("id", newsId);

          return NextResponse.json({
            success: true,
            network: "instagram",
            mediaId: rec.mediaId,
            reconciled: true,
            message: "Publicação prévia recuperada e confirmada no feed do Instagram.",
          });
        }

        if (rec.error) {
          await supabaseAdmin
            .from("news")
            .update({
              instagram_status: "incerto",
              instagram_error: `Publicação interrompida há mais de 5 minutos e reconciliação inconclusiva (${rec.error}). Verifique no Instagram antes de reenviar.`,
            })
            .eq("id", newsId);

          return NextResponse.json(
            {
              error:
                "Status incerto: verificação no Instagram falhou. Verifique no feed antes de reenviar.",
              status: "incerto",
            },
            { status: 500 }
          );
        }
      }
    }

    // 7. Aquisição do Lock Atômico
    const nowIso = new Date().toISOString();
    const lockPayload =
      network === "facebook"
        ? {
            facebook_status: "publicando",
            facebook_attempted_at: nowIso,
            facebook_error: null,
          }
        : {
            instagram_status: "publicando",
            instagram_attempted_at: nowIso,
            instagram_error: null,
          };

    const { data: locked, error: lockErr } = await supabaseAdmin
      .from("news")
      .update(lockPayload)
      .eq("id", newsId)
      .eq(network === "facebook" ? "facebook_status" : "instagram_status", currentStatus)
      .select("id")
      .maybeSingle();

    if (lockErr || !locked) {
      return NextResponse.json(
        { error: "Conflito de concorrência: a publicação já foi iniciada por outra requisição simultânea." },
        { status: 409 }
      );
    }

    // 8. Execução da Publicação
    const metaConfig = getMetaConfig();
    const attemptedDate = new Date(nowIso);

    if (network === "facebook") {
      const caption = formatFacebookCaption(news, metaConfig.siteUrl);

      try {
        const fbRes = await publishFacebookPhoto(metaConfig, {
          imageUrl,
          caption,
        });

        const postId = fbRes.post_id || fbRes.id;
        await supabaseAdmin
          .from("news")
          .update({
            facebook_status: "publicado",
            facebook_post_id: postId,
            facebook_published_at: new Date().toISOString(),
            facebook_error: null,
          })
          .eq("id", newsId);

        return NextResponse.json({
          success: true,
          network: "facebook",
          postId,
        });
      } catch (err: any) {
        console.error("Erro ao publicar no Facebook:", err);
        const errMsg = String(err?.message || "Erro desconhecido");
        const isTimeout =
          err?.name === "AbortError" ||
          errMsg.toLowerCase().includes("timeout") ||
          errMsg.toLowerCase().includes("fetch failed");

        if (isTimeout) {
          const rec = await reconcileFacebookPhoto(metaConfig, attemptedDate, news.titulo);
          if (rec.found && rec.postId) {
            await supabaseAdmin
              .from("news")
              .update({
                facebook_status: "publicado",
                facebook_post_id: rec.postId,
                facebook_published_at: rec.publishedAt || new Date().toISOString(),
                facebook_error: null,
              })
              .eq("id", newsId);

            return NextResponse.json({
              success: true,
              network: "facebook",
              postId: rec.postId,
              reconciled: true,
            });
          }

          if (rec.error) {
            await supabaseAdmin
              .from("news")
              .update({
                facebook_status: "incerto",
                facebook_error: `Timeout de rede e reconciliação inconclusiva (${rec.error}). Verifique na Página do Facebook antes de reenviar.`,
              })
              .eq("id", newsId);

            return NextResponse.json(
              { error: "Publicação com status 'incerto' devido a timeout de rede.", status: "incerto" },
              { status: 500 }
            );
          }

          await supabaseAdmin
            .from("news")
            .update({
              facebook_status: "erro",
              facebook_error:
                "A requisição sofreu timeout. Verificado na Meta: o post não foi criado. Seguro para reenviar.",
            })
            .eq("id", newsId);

          return NextResponse.json(
            { error: "Timeout na comunicação com a Meta. Nenhum post foi criado. Seguro para nova tentativa.", status: "erro" },
            { status: 500 }
          );
        }

        await supabaseAdmin
          .from("news")
          .update({
            facebook_status: "erro",
            facebook_error: errMsg,
          })
          .eq("id", newsId);

        return NextResponse.json({ error: errMsg, status: "erro" }, { status: 500 });
      }
    } else {
      // Instagram
      const caption = formatInstagramCaption(news);

      try {
        const igRes = await publishToInstagramTwoStep(metaConfig, {
          imageUrl,
          caption,
          existingContainerId: news.instagram_container_id || null,
          onContainerCreated: async (containerId) => {
            await supabaseAdmin
              .from("news")
              .update({ instagram_container_id: containerId })
              .eq("id", newsId);
          },
        });

        await supabaseAdmin
          .from("news")
          .update({
            instagram_status: "publicado",
            instagram_media_id: igRes.mediaId,
            instagram_published_at: new Date().toISOString(),
            instagram_error: null,
          })
          .eq("id", newsId);

        return NextResponse.json({
          success: true,
          network: "instagram",
          mediaId: igRes.mediaId,
        });
      } catch (err: any) {
        console.error("Erro ao publicar no Instagram:", err);
        const errMsg = String(err?.message || "Erro desconhecido");
        const isTimeout =
          err?.name === "AbortError" ||
          errMsg.toLowerCase().includes("timeout") ||
          errMsg.toLowerCase().includes("fetch failed");

        const { data: currentNews } = await supabaseAdmin
          .from("news")
          .select("instagram_container_id")
          .eq("id", newsId)
          .single();

        if (isTimeout) {
          const rec = await reconcileInstagramMedia(
            metaConfig,
            currentNews?.instagram_container_id || null,
            attemptedDate,
            news.titulo
          );

          if (rec.found && rec.mediaId) {
            await supabaseAdmin
              .from("news")
              .update({
                instagram_status: "publicado",
                instagram_media_id: rec.mediaId,
                instagram_published_at: rec.publishedAt || new Date().toISOString(),
                instagram_error: null,
              })
              .eq("id", newsId);

            return NextResponse.json({
              success: true,
              network: "instagram",
              mediaId: rec.mediaId,
              reconciled: true,
            });
          }

          if (rec.error) {
            await supabaseAdmin
              .from("news")
              .update({
                instagram_status: "incerto",
                facebook_error: `Timeout de rede e reconciliação inconclusiva (${rec.error}). Verifique no perfil do Instagram antes de reenviar.`,
              })
              .eq("id", newsId);

            return NextResponse.json(
              { error: "Publicação com status 'incerto' devido a timeout de rede.", status: "incerto" },
              { status: 500 }
            );
          }

          await supabaseAdmin
            .from("news")
            .update({
              instagram_status: "erro",
              instagram_error:
                "A requisição sofreu timeout. Verificado no Instagram: a publicação não foi criada. Seguro para reenviar.",
            })
            .eq("id", newsId);

          return NextResponse.json(
            { error: "Timeout na comunicação com a Meta. Nenhuma mídia foi criada. Seguro para nova tentativa.", status: "erro" },
            { status: 500 }
          );
        }

        await supabaseAdmin
          .from("news")
          .update({
            instagram_status: "erro",
            instagram_error: errMsg,
          })
          .eq("id", newsId);

        return NextResponse.json({ error: errMsg, status: "erro" }, { status: 500 });
      }
    }
  } catch (globalErr: any) {
    console.error("Erro interno no endpoint /api/social/publish:", globalErr);
    return NextResponse.json(
      { error: globalErr?.message || "Erro interno do servidor ao processar publicação social." },
      { status: 500 }
    );
  }
}
