-- Table: public.tx

-- DROP TABLE public.tx;

CREATE TABLE public.tx
(
    tx_hash VARCHAR(128) NOT NULL, --Tx Hash 
    network VARCHAR(64) NOT NULL, -- Network name
    tx_options JSONB NULL, --Transaction Options,
    tx_receipt JSONB NULL, --Transaction Receipt,
    created timestamp with time zone  NOT NULL DEFAULT now(), --Created on
    updated timestamp with time zone      NULL, --Updated on
    CONSTRAINT tx PRIMARY KEY (tx_hash)
)
WITH (
  OIDS=FALSE
);
ALTER TABLE public.tx
  OWNER TO root;
