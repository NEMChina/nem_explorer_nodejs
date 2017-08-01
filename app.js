import express from './app/config/express';
import mongodb from './app/config/mongoose';
import config from './app/config/config';

let db = mongodb();
let app = express();