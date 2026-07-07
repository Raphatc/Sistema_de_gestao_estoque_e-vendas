# Etapa 1: Preparar e Compilar
FROM maven:3.9-eclipse-temurin-25 AS build
WORKDIR /app

# Copia todos os arquivos do projeto para o contêiner
COPY . .

# ENTRA na pasta backend e compila o projeto de lá
RUN cd backend && mvn clean package -DskipTests

# Pega o arquivo .jar gerado e renomeia
RUN mv backend/target/*.jar app.jar

# Etapa 2: Criar o Servidor Leve e Rápido
FROM eclipse-temurin:25-jre-alpine
WORKDIR /app

# Pega apenas o pacote final pronto da etapa anterior
COPY --from=build /app/app.jar .

# Expõe a porta de comunicação
EXPOSE 8080

# Liga o motor do Spring Boot
ENTRYPOINT ["java", "-jar", "app.jar"]