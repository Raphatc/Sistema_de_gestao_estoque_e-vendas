package com.sistema.tabacaria.repository;

import com.sistema.tabacaria.model.Pod;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface PodRepository extends JpaRepository<Pod, Long> {
    // Aqui você pode criar buscas personalizadas depois,
    // como buscar todos os pods de uma marca específica.
}