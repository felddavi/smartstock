package com.smartstock.backend.dto;

import com.smartstock.backend.model.enums.TipoMovimentacao;

public record MovimentacaoRequestDTO(
    Long produtoId,
    TipoMovimentacao tipo,
    Integer quantidade,
    String motivo
) {
}
