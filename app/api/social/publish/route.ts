import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import {
  getMetaConfig,
  formatFacebookCaption,
  formatInstagramCaption,
  publishFacebookPhoto,
  publishToInstagramTwoStep,
  reconcileFacebookPhoto,
  reconcileInstagramMedia,
} from "@/lib/meta";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

interface RequestBody {
  newsId: string;
  network: "facebook" | "instagram";
  action?: "publish" | "resolve_mark_published" | "resolve_retry" | "reconcile";
}

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

    // 2. Leitura e Validação do Corpo da Requisição
    const body = (await req.json().catch(() => null)) as RequestBody | null;
    if (!body || !body.newsId || !body.network) {
      return NextResponse.json(
        { error: "Parâmetros obrigatórios ausentes: 'newsId' e 'network' ('facebook' ou 'instagram')." },
        { status: 400 }
      );
    }

    const { newsId, network, action = "publish" } = body;
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
              instagram_container_id: null, // Limpa o container para nova tentativa limpa
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

      // Se iniciou há menos de 5 minutos, bloqueia com 409
      if (tempoDecorridoMs < cincoMinutosMs) {
        return NextResponse.json(
          {
            error: "Publicação já em andamento. Aguarde alguns instantes até a conclusão do processo.",
          },
          { status: 409 }
        );
      }

      // Se já passaram mais de 5 minutos, É OBRIGATÓRIO reconciliar antes de qualquer reenvio!
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
        // Se rec.found === false e sem erro: Meta confirmou que o post não existe. Liberado para novo envio!
      } else {
        // Instagram
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
        // Se rec.found === false: mídia não existe no feed. Liberado para novo envio!
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
      // Instagram: com reaproveitamento do container_id se existente
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
