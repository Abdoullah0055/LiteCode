FROM node:24-alpine
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev --ignore-scripts
COPY runner ./runner
USER node
ENV NODE_ENV=production RUNNER_HOST=0.0.0.0 PORT=4001
EXPOSE 4001
CMD ["node", "runner/server.mjs"]
