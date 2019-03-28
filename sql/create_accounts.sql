-- Table: public.accounts

-- DROP TABLE public.accounts;

CREATE TABLE public.accounts
(
    address VARCHAR(44) NOT NULL, --Funding account address
    network VARCHAR(64), -- Network id
    status VARCHAR(128), --Status of account
    CONSTRAINT accounts_pkey PRIMARY KEY (address,network)
)
WITH (
  OIDS=FALSE
);
ALTER TABLE public.accounts
  OWNER TO root;
