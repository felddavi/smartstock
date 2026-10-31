package com.smartstock.backend.controller;

import com.smartstock.backend.dto.MovimentacaoRequestDTO;
import com.smartstock.backend.model.Movimentacao;
import com.smartstock.backend.model.Produto;
import com.smartstock.backend.model.enums.TipoMovimentacao;
import com.smartstock.backend.service.MovimentacaoService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(MovimentacaoController.class)
class MovimentacaoControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private MovimentacaoService movimentacaoService;

    @Test
    @DisplayName("POST /api/movimentacoes - Deve retornar 201 Created quando movimentação for registrada com sucesso")
    void deveRetornar201AoRegistrarMovimentacaoValida() throws Exception {
        Produto produto = new Produto(1L, "Teclado", "Periféricos", new BigDecimal("100.00"), 15, 2);
        Movimentacao mov = new Movimentacao(
                10L, produto, TipoMovimentacao.ENTRADA_REPOSICAO, 5, "Compra nota 123", LocalDateTime.now()
        );

        when(movimentacaoService.registrarMovimentacao(
                eq(1L), eq(TipoMovimentacao.ENTRADA_REPOSICAO), eq(5), eq("Compra nota 123")
        )).thenReturn(mov);

        String jsonRequest = """
                {
                    "produtoId": 1,
                    "tipo": "ENTRADA_REPOSICAO",
                    "quantidade": 5,
                    "motivo": "Compra nota 123"
                }
                """;

        mockMvc.perform(post("/api/movimentacoes")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(jsonRequest))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value(10))
                .andExpect(jsonPath("$.tipoMovimentacao").value("ENTRADA_REPOSICAO"))
                .andExpect(jsonPath("$.quantidade").value(5))
                .andExpect(jsonPath("$.motivo").value("Compra nota 123"));
    }

    @Test
    @DisplayName("POST /api/movimentacoes - Deve retornar 400 Bad Request com mensagem em texto quando service lançar exceção")
    void deveRetornar400QuandoServiceLancarExcecao() throws Exception {
        String mensagemErro = "Estoque insuficiente! Quantidade atual: 2. Quantidade solicitada: 10.";
        when(movimentacaoService.registrarMovimentacao(any(), any(), any(), any()))
                .thenThrow(new RuntimeException(mensagemErro));

        String jsonRequest = """
                {
                    "produtoId": 1,
                    "tipo": "SAIDA_AVARIA",
                    "quantidade": 10,
                    "motivo": "Perda"
                }
                """;

        mockMvc.perform(post("/api/movimentacoes")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(jsonRequest))
                .andExpect(status().isBadRequest())
                .andExpect(content().string(mensagemErro));
    }

    @Test
    @DisplayName("GET /api/movimentacoes - Deve retornar 200 OK com lista de histórico")
    void deveRetornar200AoListarHistorico() throws Exception {
        Produto produto = new Produto(1L, "Mouse", "Periféricos", new BigDecimal("50.00"), 10, 2);
        Movimentacao mov = new Movimentacao(
                1L, produto, TipoMovimentacao.ENTRADA_REPOSICAO, 10, "Estoque inicial", LocalDateTime.now()
        );

        when(movimentacaoService.listarHistorico()).thenReturn(List.of(mov));

        mockMvc.perform(get("/api/movimentacoes"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value(1))
                .andExpect(jsonPath("$[0].tipoMovimentacao").value("ENTRADA_REPOSICAO"))
                .andExpect(jsonPath("$[0].quantidade").value(10));
    }

    @Test
    @DisplayName("GET /api/movimentacoes/produto/{produtoId} - Deve retornar 200 OK com histórico do produto")
    void deveRetornar200AoListarHistoricoPorProduto() throws Exception {
        Produto produto = new Produto(2L, "Monitor", "Monitores", new BigDecimal("900.00"), 5, 1);
        Movimentacao mov = new Movimentacao(
                5L, produto, TipoMovimentacao.SAIDA_VENDA, 1, "Venda balcão", LocalDateTime.now()
        );

        when(movimentacaoService.listarHistoricoPorProduto(2L)).thenReturn(List.of(mov));

        mockMvc.perform(get("/api/movimentacoes/produto/2"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value(5))
                .andExpect(jsonPath("$[0].produto.id").value(2))
                .andExpect(jsonPath("$[0].tipoMovimentacao").value("SAIDA_VENDA"));
    }
}
