docker stop pg-test || true && docker rm -f pg-test || true
docker build -t testdb -f circle.Dockerfile .
docker run -p 5433:5432 --name pg-test -d testdb
npm run test
