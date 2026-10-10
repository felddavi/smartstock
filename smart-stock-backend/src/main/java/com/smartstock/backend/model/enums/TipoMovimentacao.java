package com.smartstock.backend.model.enums;

public enum TipoMovimentacao {
    ENTRADA_REPOSICAO,
    ENTRADA_DEVOLUCAO,
    SAIDA_VENDA,
    SAIDA_AVARIA;

    public boolean isEntrada() {
        return this == ENTRADA_REPOSICAO || this == ENTRADA_DEVOLUCAO;
    }

    public boolean isSaida() {
        return this == SAIDA_VENDA || this == SAIDA_AVARIA;
    }
}
