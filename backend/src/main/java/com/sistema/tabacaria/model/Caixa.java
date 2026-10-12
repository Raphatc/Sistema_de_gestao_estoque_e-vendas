package com.sistema.tabacaria.model;

import jakarta.persistence.*;
import lombok.Data;

@Data
@Entity
@Table(name = "caixa")
public class Caixa {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Double saldo = 0.0;
    private Double gastoMercadoria = 0.0;
    private Double divida = 0.0;
}
