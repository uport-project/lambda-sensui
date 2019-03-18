-- Table: public.fundings

-- DROP TABLE public.fundings;

CREATE TABLE public.fundings
(
    tx_hash VARCHAR(66) NOT NULL, --Funding account address
    network VARCHAR(64), -- Network id
    decoded_tx JSONB, -- Decoded Tx
    CONSTRAINT fundings_pkey PRIMARY KEY (tx_hash,network)
)
WITH (
  OIDS=FALSE
);
ALTER TABLE public.fundings
  OWNER TO root;
