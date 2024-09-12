FROM node:20.17

WORKDIR /backend

COPY package*.json .

RUN npm i 

COPY . .

ENV PORT=3500

EXPOSE 3500 

CMD ["npm", "start"]