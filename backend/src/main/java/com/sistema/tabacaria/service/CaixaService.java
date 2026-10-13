package com.sistema.tabacaria.service;

import com.sistema.tabacaria.model.Caixa;
import com.sistema.tabacaria.repository.CaixaRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class CaixaService {

    @Autowired
    private CaixaRepository repository;

    public Caixa getOrCreate() {
        List<Caixa> caixas = repository.findAll();
        if (caixas.isEmpty()) {
            Caixa c = new Caixa();
            c.setSaldo(0.0);
            c.setGastoMercadoria(0.0);
            c.setDivida(0.0);
            return repository.save(c);
        }
        return caixas.get(0);
    }

    /**
     * Venda paga: entra dinheiro no caixa e abate a dívida (se houver).
     */
    @Transactional
    public Caixa registrarPagamento(double valor) {
        if (valor <= 0) {
            return getOrCreate();
        }
        Caixa caixa = getOrCreate();
        caixa.setSaldo(nvl(caixa.getSaldo()) + valor);
        caixa.setDivida(Math.max(0.0, nvl(caixa.getDivida()) - valor));
        return repository.save(caixa);
    }

    /**
     * Desfaz o efeito de uma venda paga no caixa.
     */
    @Transactional
    public Caixa reverterPagamento(double valor) {
        if (valor <= 0) {
            return getOrCreate();
        }
        Caixa caixa = getOrCreate();
        caixa.setSaldo(Math.max(0.0, nvl(caixa.getSaldo()) - valor));
        caixa.setDivida(nvl(caixa.getDivida()) + valor);
        return repository.save(caixa);
    }

    /**
     * Atualiza saldo e gasto. A dívida sobe/desce com a variação do gasto
     * (nova mercadoria = mais dívida). Opcionalmente recalcula dívida = gasto - saldo.
     */
    @Transactional
    public Caixa atualizar(Double novoSaldo, Double novoGasto, boolean recalcularDivida) {
        Caixa caixa = getOrCreate();
        double saldoAnterior = nvl(caixa.getSaldo());
        double gastoAnterior = nvl(caixa.getGastoMercadoria());
        double saldo = novoSaldo != null ? novoSaldo : saldoAnterior;
        double gasto = novoGasto != null ? novoGasto : gastoAnterior;

        caixa.setSaldo(saldo);
        caixa.setGastoMercadoria(gasto);

        if (recalcularDivida) {
            caixa.setDivida(Math.max(0.0, gasto - saldo));
        } else {
            double deltaGasto = gasto - gastoAnterior;
            caixa.setDivida(Math.max(0.0, nvl(caixa.getDivida()) + deltaGasto));
        }

        return repository.save(caixa);
    }

    private double nvl(Double v) {
        return v != null ? v : 0.0;
    }
}
