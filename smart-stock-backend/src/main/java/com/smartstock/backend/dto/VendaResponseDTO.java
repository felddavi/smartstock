package com.smartstock.backend.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

public record VendaResponseDTO(
    Long id,
    LocalDateTime dataHora,
    BigDecimal valorTotal,
    List<ItemVendaResponseDTO> itens
) {
}
