import {chooseMove} from './engine.js';
self.onmessage=({data})=>{
 try{self.postMessage({id:data.id,move:chooseMove(data)});}
 catch(error){self.postMessage({id:data.id,error:error.message});}
};
