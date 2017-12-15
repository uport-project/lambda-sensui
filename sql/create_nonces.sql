-- Table: public.nonces

-- DROP TABLE public.nonces;

CREATE TABLE public.nonces
(
    address VARCHAR(100) NOT NULL, --Funding account address
    nonce integer, --Nonce
    network VARCHAR(50) -- Network name
  CONSTRAINT nonces_pkey PRIMARY KEY (address)
)
WITH (
  OIDS=FALSE
);
ALTER TABLE public.nonces
  OWNER TO root;