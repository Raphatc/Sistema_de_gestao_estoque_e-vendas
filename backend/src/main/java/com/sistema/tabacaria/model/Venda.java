package com.sistema.tabacaria.model;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDate;

@Data
@Entity
@Table(name = "vendas")
public class Venda {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String marca;
    private String sabor;
    private Double faturamento;
    private Double lucro;
    private LocalDate dataVenda;
}