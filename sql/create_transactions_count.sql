-- Table: public.transactions

-- DROP TABLE public.transactions_count;

CREATE TABLE public.transactions_count
(
  id character varying(66) NOT NULL, -- Identifier
  network_id VARCHAR(50) NOT NULL, -- Network name
  txcount int  NOT NULL, -- Number of transactions
  CONSTRAINT transactions_count_pkey PRIMARY KEY (id)
)
WITH (
  OIDS=FALSE
);
ALTER TABLE public.transactions_count
  OWNER TO root;