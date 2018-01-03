-- Table: public.nonces

-- DROP TABLE public.nonces;

CREATE TABLE public.nonces
(
    address VARCHAR(44) NOT NULL, --Funding account address
    network VARCHAR(64), -- Network name
    nonce integer, --Nonce
    CONSTRAINT nonces_pkey PRIMARY KEY (address,network)
)
WITH (
  OIDS=FALSE
);
ALTER TABLE public.nonces
  OWNER TO root;
