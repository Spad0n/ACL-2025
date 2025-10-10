function handleSwitch(){
    const con1 = document.getElementById("conteneur");
    const con2 = document.getElementById("conteneur1");
    if(con1){
        con1.classList.toggle("actif");
    }
    if(con2){
        con2.classList.toggle("actif");
    }
}

