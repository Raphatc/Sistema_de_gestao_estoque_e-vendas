package com.sistema.tabacaria.model;

import jakarta.persistence.*;
import lombok.Data;

@Data
@Entity
@Table(name = "pods")
public class Pod {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String marca;

    @Column(nullable = false)
    private String sabor;

    private Integer estoque;

    private Double precoAtacado;

    private Double precoVarejo;

    private String imagemUrl;

    private Integer vendidos = 0;

    public Integer getVendidos() {
        return vendidos != null ? vendidos : 0;
    }
}