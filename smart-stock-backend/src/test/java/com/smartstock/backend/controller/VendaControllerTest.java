package com.smartstock.backend.controller;

import com.smartstock.backend.dto.ItemVendaDTO;
import com.smartstock.backend.dto.ItemVendaResponseDTO;
import com.smartstock.backend.dto.VendaRequestDTO;
import com.smartstock.backend.dto.VendaResponseDTO;
import com.smartstock.backend.service.VendaService;
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
import java.util.Optional;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(VendaController.class)
class VendaControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private VendaService vendaService;

    @Test
    @DisplayName("POST /api/vendas - Deve retornar 201 Created quando a venda for válida")
    void deveRetornar201AoRealizarVendaValida() throws Exception {
        VendaResponseDTO responseDTO = new VendaResponseDTO(
                1L,
                LocalDateTime.of(2026, 10, 24, 15, 0),
                new BigDecimal("150.00"),
                List.of(new ItemVendaResponseDTO(
                        10L, 1L, "Teclado", 1, new BigDecimal("150.00"), new BigDecimal("150.00")
                ))
        );

        when(vendaService.realizarVenda(any(VendaRequestDTO.class))).thenReturn(responseDTO);

        String jsonRequest = """
                {
                    "itens": [
                        { "produtoId": 1, "quantidade": 1 }
                    ]
                }
                """;

        mockMvc.perform(post("/api/vendas")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(jsonRequest))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value(1))
                .andExpect(jsonPath("$.valorTotal").value(150.00))
                .andExpect(jsonPath("$.itens[0].produtoNome").value("Teclado"));
    }

    @Test
    @DisplayName("POST /api/vendas - Deve retornar 400 Bad Request com texto simples quando o service lançar RuntimeException")
    void deveRetornar400ComTextoDaMensagemQuandoServiceLancarExcecao() throws Exception {
        String mensagemErro = "Estoque insuficiente para o produto 'Monitor'! Saldo disponível: 1, solicitado: 5.";
        when(vendaService.realizarVenda(any(VendaRequestDTO.class)))
                .thenThrow(new RuntimeException(mensagemErro));

        String jsonRequest = """
                {
                    "itens": [
                        { "produtoId": 2, "quantidade": 5 }
                    ]
                }
                """;

        mockMvc.perform(post("/api/vendas")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(jsonRequest))
                .andExpect(status().isBadRequest())
                .andExpect(content().string(mensagemErro));
    }

    @Test
    @DisplayName("GET /api/vendas - Deve retornar 200 OK com lista de vendas")
    void deveRetornar200AoListarVendas() throws Exception {
        VendaResponseDTO responseDTO = new VendaResponseDTO(
                1L,
                LocalDateTime.of(2026, 10, 24, 15, 0),
                new BigDecimal("100.00"),
                List.of()
        );

        when(vendaService.listarTodas()).thenReturn(List.of(responseDTO));

        mockMvc.perform(get("/api/vendas"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value(1))
                .andExpect(jsonPath("$[0].valorTotal").value(100.00));
    }

    @Test
    @DisplayName("GET /api/vendas/{id} - Deve retornar 200 OK quando encontrar venda por ID")
    void deveRetornar200AoBuscarVendaPorIdExistente() throws Exception {
        VendaResponseDTO responseDTO = new VendaResponseDTO(
                1L,
                LocalDateTime.of(2026, 10, 24, 15, 0),
                new BigDecimal("100.00"),
                List.of()
        );

        when(vendaService.buscarPorId(1L)).thenReturn(Optional.of(responseDTO));

        mockMvc.perform(get("/api/vendas/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(1));
    }

    @Test
    @DisplayName("GET /api/vendas/{id} - Deve retornar 404 Not Found quando não encontrar")
    void deveRetornar404AoBuscarVendaPorIdInexistente() throws Exception {
        when(vendaService.buscarPorId(99L)).thenReturn(Optional.empty());

        mockMvc.perform(get("/api/vendas/99"))
                .andExpect(status().isNotFound());
    }
}
