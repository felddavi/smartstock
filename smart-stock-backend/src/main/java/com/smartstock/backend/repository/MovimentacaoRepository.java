package com.smartstock.backend.repository;

import com.smartstock.backend.model.Movimentacao;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MovimentacaoRepository extends JpaRepository<Movimentacao, Long> {

    // Buscar histórico de movimentações ordenado pela data mais recente
    List<Movimentacao> findAllByOrderByDataHoraDesc();

    // Buscar todas as movimentações de um produto específico
    List<Movimentacao> findByProdutoId(Long produtoId);

}