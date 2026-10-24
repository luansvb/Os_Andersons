(function(){
const data=JSON.parse(document.getElementById('lcv5-install-data').textContent);
  const agile14={1:'Branco/marrom',2:'Verde/marrom',3:'Rosa/verde',4:'Amarelo/preto',5:'Rosa/preto',6:'Branco/verde',7:'Azul/vermelho',8:'Amarelo/marrom',9:'Azul/amarelo',10:'Vermelho/verde',11:'Branco/roxo',12:'Branco/laranja',13:'Branco/cinza',14:'Branco/vermelho'};
  const agile16={1:agile14[1],2:agile14[2],3:agile14[3],4:agile14[4],5:agile14[5],6:agile14[6],7:agile14[7],8:'Preto',9:agile14[8],10:agile14[9],11:agile14[10],12:agile14[11],13:agile14[12],14:agile14[13],15:agile14[14],16:'Vermelho/amarelo'};
  function pinColor(pin,harness='agile') {
    return harness==='original'?pin.color:(pin.connector===14?agile14:agile16)[pin.number];
  }

window.LCV5Installation=Object.freeze({data,pinColor});
})();
