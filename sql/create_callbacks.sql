-- Table: public.callbacks

-- DROP TABLE public.callbacks;

CREATE TABLE public.callbacks
(
    tx_hash VARCHAR(66) NOT NULL, --Fund tx hash
    network VARCHAR(64), -- Network id
    callback_url  TEXT, -- Callback
    CONSTRAINT callbacks_pkey PRIMARY KEY (tx_hash,network)
)
WITH (
  OIDS=FALSE
);
ALTER TABLE public.callbacks
  OWNER TO root;
