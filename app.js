import dotenv from 'dotenv'
import express from 'express'
import auth from './router/authentication.js'
import cors from 'cors';
import mongoose from 'mongoose';

const app = express();

dotenv.config({path : './.env'}); 

const PORT = process.env.PORT;

const dataBase = process.env.DATABASE;

mongoose.connect(dataBase, {useUnifiedTopology : true,
    useNewUrlParser : true}).then(() => {
    console.log ("Mongoose connection started")
}).catch((err)=> console.log("Mongoose connection refused", err))

app.use(
    cors({
      origin: ["https://reset-password-client.netlify.app"],
      methods: ["GET", "POST", "PUT", "DELETE"],
      credentials: true,
    })
  );

app.listen(PORT, () => {
    console.log('server running at port no.', PORT)
})


app.use(express.urlencoded({extended: true}));
app.use(express.json());
app.use(auth);




