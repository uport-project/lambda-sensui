SELECT day, network, sum(pending) as pending, sum(mined) as mined
  FROM (
	SELECT date_trunc('day', created) as day, network, count(*) as pending, 0 as mined
	  FROM tx
	 WHERE tx_receipt IS NULL
	   AND created < now() - INTERVAL '1 hour' --Only pending for more than 1 hour
	 GROUP BY day,network
	UNION ALL
	SELECT date_trunc('day', created) as day, network, 0 as pending, count(*) as mined
	  FROM tx
	 WHERE tx_receipt IS NOT NULL
	 GROUP BY day,network
 ) t
-- WHERE network='rinkeby'
 GROUP BY day, network
 ORDER BY day desc, network desc
 