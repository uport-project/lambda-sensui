FROM postgres

ENV POSTGRES_USER root
ENV POSTGRES_DB sensui
ENV POSTGRES_PASSWORD sensui

ADD sql/create_nonces.sql /docker-entrypoint-initdb.d/

EXPOSE 5432