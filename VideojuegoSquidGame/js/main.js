import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {FBXLoader} from 'three/addons/loaders/FBXLoader.js';
var medidas={largo:80,ancho:35,alto:20,inicio:-34,meta:32};
var figuras={muneca:{altura:4,giro:-Math.PI/2},arbol:{altura:8,giro:-Math.PI/5.5},guardias:{altura:2.3,giro:-Math.PI/2,separacion:4.5}};
var ritmo={verdeMin:2,verdeMax:5,rojoMin:2,rojoMax:4,giro:0.7};
var movimiento={altura:1.8,velocidad:5,salto:5.5,gravedad:12,giro:0};
var ajustesLaser={radioJugador:0.3,radioHaz:0.035,lenta:0.24,rapida:1,inmunidad:1.6};
var limitesEstrellas=[30,45,60,90];
var datosLaser=[{x:medidas.inicio+12,lado:1,altura:0.48,alcance:medidas.ancho,amplitud:0.18,color:0xff3155,fase:0.2},{x:-8,lado:-1,altura:1.4,alcance:medidas.ancho*0.62,amplitud:0.34,color:0xff7a25,fase:2},{x:7,lado:-1,altura:0.48,alcance:medidas.ancho,amplitud:0.18,color:0xff3155,fase:1},{x:23,lado:1,altura:1.4,alcance:medidas.ancho*0.62,amplitud:0.3,color:0xff7a25,fase:3}];
var renderizador,escena,camara;
var reloj=new THREE.Clock();
var cargadorGLB=new GLTFLoader();
var cargadorFBX=new FBXLoader();
var cargadorTexturas=new THREE.TextureLoader();
var recursosPendientes=13;
var listo=false;
var errorCarga='';
var estadoPartida='cargando';
var tiempoPartida=0;
var inmunidadLaser=0;
var teclas={w:false,a:false,s:false,d:false};
var pedirSalto=false;
var jugador,modeloJugador,muneca,arbol,guardiaIzquierdo,guardiaDerecho;
var archivosJugador=[];
var accionesJugador={};
var mezcladorJugador;
var animacionJugador='quieto';
var alturaModeloJugador=0;
var velocidadVertical=0;
var enSuelo=true;
var moviendo=false;
var muerteTerminada=false;
var cajaJugador=new THREE.Box3();
var frente=new THREE.Vector3();
var derecha=new THREE.Vector3();
var direccionJugador=new THREE.Vector3();
var objetivoCamara=new THREE.Vector3();
var posicionCamara=new THREE.Vector3();
var anguloCamara=-Math.PI/2;
var elevacionCamara=0.35;
var distanciaCamara=5.5;
var primeraCamara=true;
var animacionMuneca;
var mezcladorCabeza,mezcladorBoca;
var estadoMuneca='verde';
var tiempoMuneca=0;
var duracionMuneca=0;
var tiempoLengua=0;
var lienzoContador,dibujoContador,texturaContador;
var textoContadorAnterior='';
var contador;
var laseres=[];
var lienzoResultado,dibujoResultado;
init();
loadScene();
render();
function init(){
    escena=new THREE.Scene();
    escena.background=new THREE.Color(0x6cb9fd);
    camara=new THREE.PerspectiveCamera(60,window.innerWidth/window.innerHeight,0.1,200);
    camara.position.set(medidas.inicio-3,4.5,0);
    camara.lookAt(medidas.meta-6,3,0);
    renderizador=new THREE.WebGLRenderer({antialias:true});
    renderizador.setSize(window.innerWidth,window.innerHeight);
    renderizador.setPixelRatio(Math.min(window.devicePixelRatio,2));
    renderizador.outputColorSpace=THREE.SRGBColorSpace;
    renderizador.toneMapping=THREE.ACESFilmicToneMapping;
    renderizador.toneMappingExposure=1;
    renderizador.shadowMap.enabled=true;
    renderizador.shadowMap.type=THREE.PCFSoftShadowMap;
    renderizador.domElement.style.display='block';
    var pantalla=document.getElementById('pantalla');
    pantalla.appendChild(renderizador.domElement);
    lienzoResultado=document.createElement('canvas');
    lienzoResultado.width=window.innerWidth;
    lienzoResultado.height=window.innerHeight;
    lienzoResultado.style.position='fixed';
    lienzoResultado.style.left='0';
    lienzoResultado.style.top='0';
    lienzoResultado.style.pointerEvents='none';
    lienzoResultado.style.zIndex='10';
    document.body.appendChild(lienzoResultado);
    dibujoResultado=lienzoResultado.getContext('2d');
    window.addEventListener('resize',updateAspectRatio);
    window.addEventListener('keydown',pulsarTecla);
    window.addEventListener('keyup',soltarTecla);
    window.addEventListener('blur',limpiarTeclas);
    document.addEventListener('visibilitychange',limpiarTeclas);
    document.addEventListener('mousemove',moverRaton);
    document.addEventListener('pointerlockerror',errorRaton);
    renderizador.domElement.addEventListener('click',capturarRaton);
    renderizador.domElement.addEventListener('wheel',acercarCamara,{passive:false});
}
function loadScene(){
    cargarEscenario();
    crearLaseres();
    cargarModelos();
}
function cargarTextura(ruta){
    var textura=cargadorTexturas.load(ruta,recursoCargado,undefined,function(){mostrarError('No se ha podido cargar '+ruta);});
    textura.colorSpace=THREE.SRGBColorSpace;
    return textura;
}

function cargarEscenario(){
    var posx=cargarTextura('./textures/entorno/posx.png');
    var negx=cargarTextura('./textures/entorno/negx.png');
    var posz=cargarTextura('./textures/entorno/posz.png');
    var negz=cargarTextura('./textures/entorno/negz.png');
    var posy=cargarTextura('./textures/entorno/posy.png');
    var cesped=cargarTextura('./textures/suelo/cesped.png');
    cesped.wrapS=THREE.RepeatWrapping;
    cesped.wrapT=THREE.RepeatWrapping;
    cesped.repeat.set(medidas.largo/5,medidas.ancho/5);
    var suelo=new THREE.Mesh(new THREE.PlaneGeometry(medidas.largo,medidas.ancho),new THREE.MeshLambertMaterial({map:cesped}));
    suelo.name='suelo';
    suelo.rotation.x=-Math.PI/2;
    suelo.receiveShadow=true;
    escena.add(suelo);
    ponerPared(posx,medidas.ancho,medidas.alto,medidas.largo/2,medidas.alto/2,0,-Math.PI/2,'posx');
    ponerPared(negx,medidas.ancho,medidas.alto,-medidas.largo/2,medidas.alto/2,0,Math.PI/2,'negx');
    ponerPared(posz,medidas.largo,medidas.alto,0,medidas.alto/2,medidas.ancho/2,Math.PI,'posz');
    ponerPared(negz,medidas.largo,medidas.alto,0,medidas.alto/2,-medidas.ancho/2,0,'negz');
    var cielo=new THREE.Mesh(new THREE.PlaneGeometry(medidas.largo,medidas.ancho),new THREE.MeshBasicMaterial({map:posy,toneMapped:false}));
    cielo.name='posy';
    cielo.rotation.x=Math.PI/2;
    cielo.position.y=medidas.alto;
    escena.add(cielo);
    ponerLinea(medidas.inicio,0xffffff,'salida');
    ponerLinea(medidas.meta,0xff0000,'meta');
    var luzAmbiente=new THREE.AmbientLight(0xe5f3ff,1.5);
    escena.add(luzAmbiente);
    var sol=new THREE.DirectionalLight(0xfff0d6,2.2);
    sol.position.set(-15,35,12);
    sol.castShadow=true;
    sol.shadow.mapSize.set(2048,2048);
    sol.shadow.camera.left=-50;
    sol.shadow.camera.right=50;
    sol.shadow.camera.top=50;
    sol.shadow.camera.bottom=-50;
    sol.shadow.camera.near=1;
    sol.shadow.camera.far=100;
    sol.shadow.normalBias=0.04;
    sol.shadow.bias=-0.0001;
    escena.add(sol);
    escena.add(sol.target);
}
function ponerPared(textura,ancho,alto,x,y,z,giro,nombre){
    var pared=new THREE.Mesh(new THREE.PlaneGeometry(ancho,alto),new THREE.MeshBasicMaterial({map:textura,toneMapped:false}));
    pared.name=nombre;
    pared.position.set(x,y,z);
    pared.rotation.y=giro;
    escena.add(pared);
}
function ponerLinea(x,color,nombre){
    var linea=new THREE.Mesh(new THREE.PlaneGeometry(0.45,medidas.ancho-2),new THREE.MeshLambertMaterial({color:color}));
    linea.name=nombre;
    linea.rotation.x=-Math.PI/2;
    linea.position.set(x,0.015,0);
    linea.receiveShadow=true;
    escena.add(linea);
}

function cargarModelos(){
    cargarFigura('./models/muneca/squid_game_doll.glb','muneca',figuras.muneca.altura,medidas.largo/2-4.1,0,figuras.muneca.giro);
    cargarFigura('./models/arbol/realistic_dead_tree.glb','arbol',figuras.arbol.altura,medidas.largo/2-3,0,figuras.arbol.giro);
    cargarFigura('./models/guardia/squid_game__pinksoldier_triangle.glb','guardiaIzquierdo',figuras.guardias.altura,medidas.largo/2-4.5,-figuras.guardias.separacion,figuras.guardias.giro);
    cargarArchivoJugador('./models/jugador/jugador.fbx',0);
    cargarArchivoJugador('./models/jugador/caminar.fbx',1);
    cargarArchivoJugador('./models/jugador/saltar.fbx',2);
    cargarArchivoJugador('./models/jugador/muerte.fbx',3);
}

function cargarFigura(ruta,nombre,altura,x,z,giro){
    cargadorGLB.load(ruta,function(archivo){
        try{
            var grupo=prepararModelo(archivo.scene,altura);
            grupo.name=nombre;
            grupo.position.set(x,0,z);
            grupo.rotation.y=giro;
            escena.add(grupo);
            if(nombre=='muneca'){
                muneca=grupo;
                animacionMuneca=archivo.animations[0];
            }
            if(nombre=='arbol'){
                arbol=grupo;
            }
            if(nombre=='guardiaIzquierdo'){
                guardiaIzquierdo=grupo;
                guardiaDerecho=grupo.clone();
                guardiaDerecho.name='guardiaDerecho';
                guardiaDerecho.position.z=figuras.guardias.separacion;
                escena.add(guardiaDerecho);
            }
            recursoCargado();
        }catch(error){
            mostrarError(error.message);
        }
    },undefined,function(){mostrarError('No se ha podido cargar '+ruta);});
}

function prepararModelo(modelo,altura){
    modelo.updateMatrixWorld(true);
    var caja=new THREE.Box3().setFromObject(modelo,true);
    var tamano=new THREE.Vector3();
    caja.getSize(tamano);
    modelo.scale.multiplyScalar(altura/tamano.y);
    modelo.updateMatrixWorld(true);
    caja.setFromObject(modelo,true);
    var centro=new THREE.Vector3();
    caja.getCenter(centro);
    modelo.position.x-=centro.x;
    modelo.position.y-=caja.min.y;
    modelo.position.z-=centro.z;
    modelo.traverse(function(objeto){
        if(objeto.isMesh){
            objeto.castShadow=true;
            objeto.receiveShadow=true;
        }
    });
    var grupo=new THREE.Object3D();
    grupo.add(modelo);
    return grupo;
}

function cargarArchivoJugador(ruta,indice){
    cargadorFBX.load(ruta,function(archivo){
        archivosJugador[indice]=archivo;
        recursoCargado();
    },undefined,function(){mostrarError('No se ha podido cargar '+ruta);});
}

function recursoCargado(){
    recursosPendientes--;
    if(recursosPendientes==0&&errorCarga==''){
        try{
            prepararJugador();
            prepararMuneca();
            listo=true;
            reiniciarPartida();
        }catch(error){
            mostrarError(error.message);
        }
    }
}

function mostrarError(texto){
    errorCarga=texto;
    listo=false;
    estadoPartida='error';
    console.error(texto);
}

function buscarCadera(animacion){
    for(var i=0;i<animacion.tracks.length;i++){
        if(animacion.tracks[i].name=='mixamorigHips.position'){
            return animacion.tracks[i];
        }
    }
    return null;
}

function prepararJugador(){
    modeloJugador=archivosJugador[0];
    var cadera=buscarCadera(modeloJugador.animations[0]);
    var nombres=['quieto','caminar','saltar','muerte'];
    mezcladorJugador=new THREE.AnimationMixer(modeloJugador);
    for(var i=0;i<4;i++){
        var animacion=archivosJugador[i].animations[0].clone();
        if(i==2){
            animacion=recortarSalto(animacion);
        }
        var pista=buscarCadera(animacion);
        if(pista!=null){
            for(var j=0;j<pista.values.length;j+=3){
                pista.values[j]=cadera.values[0];
                pista.values[j+2]=cadera.values[2];
                if(i==2){
                    pista.values[j+1]=cadera.values[1];
                }
            }
        }
        accionesJugador[nombres[i]]=mezcladorJugador.clipAction(animacion);
    }
    accionesJugador.saltar.setLoop(THREE.LoopOnce,1);
    accionesJugador.saltar.clampWhenFinished=true;
    accionesJugador.muerte.setLoop(THREE.LoopOnce,1);
    accionesJugador.muerte.clampWhenFinished=true;
    accionesJugador.saltar.setEffectiveTimeScale(accionesJugador.saltar.getClip().duration/(2*movimiento.salto/movimiento.gravedad));
    accionesJugador.quieto.play();
    mezcladorJugador.update(0);
    jugador=prepararModelo(modeloJugador,movimiento.altura);
    jugador.name='jugador';
    alturaModeloJugador=modeloJugador.position.y;
    escena.add(jugador);
}

function recortarSalto(animacion){
    var pistas=[];
    var primerTiempo=1000;
    for(var i=0;i<animacion.tracks.length;i++){
        var pista=animacion.tracks[i].clone();
        var tiempos=[];
        var valores=[];
        var cantidad=pista.getValueSize();
        for(var j=0;j<pista.times.length;j++){
            var fotograma=pista.times[j]*60;
            if(fotograma>=30&&fotograma<67){
                tiempos.push(pista.times[j]);
                for(var k=0;k<cantidad;k++){
                    valores.push(pista.values[j*cantidad+k]);
                }
            }
        }
        if(tiempos.length>0){
            pista.times=new Float32Array(tiempos);
            pista.values=new Float32Array(valores);
            primerTiempo=Math.min(primerTiempo,tiempos[0]);
            pistas.push(pista);
        }
    }
    for(var i=0;i<pistas.length;i++){
        for(var j=0;j<pistas[i].times.length;j++){
            pistas[i].times[j]-=primerTiempo;
        }
    }
    return new THREE.AnimationClip('saltar',-1,pistas);
}

function prepararMuneca(){
    var nombresCabeza=[];
    var raices=['DEF-spine006_014','ORG-spine006_0120'];
    for(var i=0;i<raices.length;i++){
        var hueso=muneca.children[0].getObjectByName(raices[i]);
        if(hueso!=null){
            hueso.traverse(function(objeto){nombresCabeza.push(objeto.name);});
        }
    }
    var pistasCabeza=[];
    var pistasBoca=[];
    for(var i=0;i<animacionMuneca.tracks.length;i++){
        var pista=animacionMuneca.tracks[i];
        var nombre=pista.name.toLowerCase();
        if(pista.name.indexOf('DEF-spine006_014.')==0||pista.name.indexOf('ORG-spine006_0120.')==0||nombre.indexOf('eye')!=-1||nombre.indexOf('lid')!=-1){
            pistasCabeza.push(pista);
        }
        var nodo=pista.name.split('.')[0];
        var esBoca=nombre.indexOf('tongue')!=-1||nombre.indexOf('jaw')!=-1||nombre.indexOf('lip')!=-1||nombre.indexOf('mouth')!=-1||nombre.indexOf('teeth')!=-1||nombre.indexOf('chin')!=-1;
        if(nombresCabeza.indexOf(nodo)!=-1&&esBoca){
            pistasBoca.push(pista);
        }
    }
    mezcladorCabeza=new THREE.AnimationMixer(muneca.children[0]);
    mezcladorCabeza.clipAction(new THREE.AnimationClip('cabeza',animacionMuneca.duration,pistasCabeza)).play();
    mezcladorBoca=new THREE.AnimationMixer(muneca.children[0]);
    mezcladorBoca.clipAction(new THREE.AnimationClip('boca',animacionMuneca.duration,pistasBoca)).play();
    lienzoContador=document.createElement('canvas');
    lienzoContador.width=512;
    lienzoContador.height=192;
    dibujoContador=lienzoContador.getContext('2d');
    texturaContador=new THREE.Texture(lienzoContador);
    texturaContador.colorSpace=THREE.SRGBColorSpace;
    contador=new THREE.Mesh(new THREE.PlaneGeometry(7,2.625),new THREE.MeshBasicMaterial({map:texturaContador,transparent:true,toneMapped:false}));
    contador.name='contadorMuneca';
    contador.rotation.y=-Math.PI/2;
    contador.position.set(medidas.largo/2-0.06,figuras.arbol.altura+2,0);
    escena.add(contador);
}

function tiempoAleatorio(minimo,maximo){
    return minimo+Math.random()*(maximo-minimo);
}

function actualizarMuneca(delta){
    if(estadoPartida=='perdido'){
        tiempoLengua=Math.min(tiempoLengua+delta,0.8);
        mezcladorBoca.setTime(6+tiempoLengua/0.8);
        return;
    }
    tiempoMuneca+=delta;
    while(tiempoMuneca>=duracionMuneca){
        tiempoMuneca-=duracionMuneca;
        if(estadoMuneca=='verde'){
            estadoMuneca='girando';
            duracionMuneca=ritmo.giro;
        }else if(estadoMuneca=='girando'){
            estadoMuneca='rojo';
            duracionMuneca=tiempoAleatorio(ritmo.rojoMin,ritmo.rojoMax);
        }else if(estadoMuneca=='rojo'){
            estadoMuneca='volviendo';
            duracionMuneca=ritmo.giro;
        }else{
            estadoMuneca='verde';
            duracionMuneca=tiempoAleatorio(ritmo.verdeMin,ritmo.verdeMax);
        }
    }
    var instante=0;
    if(estadoMuneca=='girando'){
        instante=2+0.5*tiempoMuneca/duracionMuneca;
    }
    if(estadoMuneca=='rojo'){
        instante=2.5+(95/12-2.5)*tiempoMuneca/duracionMuneca;
    }
    if(estadoMuneca=='volviendo'){
        instante=95/12+(5/12)*tiempoMuneca/duracionMuneca;
    }
    mezcladorCabeza.setTime(instante);
    mezcladorBoca.setTime(0);
    pintarContador();
}

function munecaMirando(){
    return estadoMuneca=='rojo'||estadoMuneca=='volviendo';
}

function pintarContador(){
    var segundos=0;
    var titulo='LUZ VERDE';
    var color='#7cfc60';
    if(estadoMuneca=='verde'){
        segundos=Math.ceil(duracionMuneca-tiempoMuneca);
    }
    if(estadoMuneca=='girando'){
        titulo='GIRANDO';
    }
    if(munecaMirando()){
        titulo='LUZ ROJA';
        color='#ff4444';
    }
    if(estadoPartida=='perdido'){
        titulo='TE HE VISTO';
        color='#ff4444';
        segundos=0;
    }
    var texto='00:'+segundos;
    if(segundos<10){
        texto='00:0'+segundos;
    }
    var clave=titulo+texto;
    if(clave==textoContadorAnterior){
        return;
    }
    textoContadorAnterior=clave;
    dibujoContador.clearRect(0,0,512,192);
    dibujoContador.fillStyle='#142018';
    dibujoContador.fillRect(8,8,496,176);
    dibujoContador.strokeStyle=color;
    dibujoContador.lineWidth=5;
    dibujoContador.strokeRect(12,12,488,168);
    dibujoContador.textAlign='center';
    dibujoContador.textBaseline='middle';
    dibujoContador.fillStyle=color;
    dibujoContador.font='bold 28px Arial';
    dibujoContador.fillText(titulo,256,49);
    dibujoContador.font='bold 86px monospace';
    dibujoContador.fillText(texto,256,119);
    texturaContador.needsUpdate=true;
}

function crearLaseres(){
    for(var i=0;i<datosLaser.length;i++){
        crearEmisor(datosLaser[i]);
    }
}

function crearEmisor(dato){
    var metal=new THREE.MeshPhongMaterial({color:0x253441,shininess:80});
    var oscuro=new THREE.MeshPhongMaterial({color:0x0e1720,shininess:20});
    var luminoso=new THREE.MeshBasicMaterial({color:dato.color,toneMapped:false});
    var soporte=new THREE.Object3D();
    soporte.position.set(dato.x,0,dato.lado*(medidas.ancho/2-0.16));
    var placa=new THREE.Mesh(new THREE.BoxGeometry(0.85,1.1,0.25),metal);
    placa.position.y=dato.altura+0.28;
    placa.castShadow=true;
    placa.receiveShadow=true;
    soporte.add(placa);
    var conducto=new THREE.Mesh(new THREE.BoxGeometry(0.12,3.1,0.1),oscuro);
    conducto.position.y=dato.altura+2.05;
    conducto.castShadow=true;
    conducto.receiveShadow=true;
    soporte.add(conducto);
    var caja=new THREE.Mesh(new THREE.BoxGeometry(0.7,0.55,0.32),metal);
    caja.position.y=dato.altura+3.45;
    caja.castShadow=true;
    caja.receiveShadow=true;
    soporte.add(caja);
    escena.add(soporte);
    var pivote=new THREE.Object3D();
    pivote.position.set(dato.x,dato.altura,dato.lado*(medidas.ancho/2-0.5));
    var cuerpo=new THREE.Mesh(new THREE.CylinderGeometry(0.22,0.26,0.55,12),metal);
    cuerpo.rotation.x=Math.PI/2;
    cuerpo.castShadow=true;
    cuerpo.receiveShadow=true;
    pivote.add(cuerpo);
    var anillo=new THREE.Mesh(new THREE.TorusGeometry(0.16,0.025,6,20),luminoso);
    anillo.position.z=0.29;
    pivote.add(anillo);
    var lente=new THREE.Mesh(new THREE.CircleGeometry(0.13,20),new THREE.MeshBasicMaterial({color:0xfff4ed,side:THREE.DoubleSide,toneMapped:false}));
    lente.position.z=0.295;
    pivote.add(lente);
    var geometria=new THREE.CylinderGeometry(1,1,1,10);
    var nucleo=new THREE.Mesh(geometria,new THREE.MeshBasicMaterial({color:0xfff0e8,toneMapped:false}));
    var brillo=new THREE.Mesh(geometria,new THREE.MeshBasicMaterial({color:dato.color,transparent:true,opacity:0.42,blending:THREE.AdditiveBlending,depthWrite:false,toneMapped:false}));
    var halo=new THREE.Mesh(geometria,new THREE.MeshBasicMaterial({color:dato.color,transparent:true,opacity:0.1,blending:THREE.AdditiveBlending,depthWrite:false,toneMapped:false}));
    nucleo.rotation.x=Math.PI/2;
    brillo.rotation.x=Math.PI/2;
    halo.rotation.x=Math.PI/2;
    pivote.add(nucleo);
    pivote.add(brillo);
    pivote.add(halo);
    var extremo=new THREE.Mesh(new THREE.SphereGeometry(0.1,8,6),luminoso);
    pivote.add(extremo);
    var luz=new THREE.PointLight(dato.color,2,3,2);
    pivote.add(luz);
    escena.add(pivote);
    var laser={dato:dato,pivote:pivote,nucleo:nucleo,brillo:brillo,halo:halo,extremo:extremo,luz:luz,inicio:new THREE.Vector3(),final:new THREE.Vector3(),fase:dato.fase,velocidad:ajustesLaser.lenta,objetivo:ajustesLaser.lenta,cambio:0,pulso:0};
    laseres.push(laser);
    colocarLaser(laser);
}

function colocarLaser(laser){
    var dato=laser.dato;
    var angulo=Math.sin(laser.fase)*dato.amplitud;
    var dx=Math.sin(angulo);
    var dz=-dato.lado*Math.cos(angulo);
    if(dato.lado==1){
        laser.pivote.rotation.y=Math.PI-angulo;
    }else{
        laser.pivote.rotation.y=angulo;
    }
    laser.inicio.set(laser.pivote.position.x+dx*0.31,dato.altura,laser.pivote.position.z+dz*0.31);
    var paredZ=medidas.ancho/2-0.04;
    if(dz<0){
        paredZ=-medidas.ancho/2+0.04;
    }
    var largo=Math.min(dato.alcance,(paredZ-laser.inicio.z)/dz);
    if(Math.abs(dx)>0.000001){
        var paredX=medidas.largo/2-0.04;
        if(dx<0){
            paredX=-medidas.largo/2+0.04;
        }
        largo=Math.min(largo,(paredX-laser.inicio.x)/dx);
    }
    largo=Math.max(0,largo);
    laser.final.set(laser.inicio.x+dx*largo,dato.altura,laser.inicio.z+dz*largo);
    laser.nucleo.position.z=0.31+largo/2;
    laser.brillo.position.z=0.31+largo/2;
    laser.halo.position.z=0.31+largo/2;
    laser.nucleo.scale.set(0.014,largo,0.014);
    laser.brillo.scale.set(0.055,largo,0.055);
    laser.halo.scale.set(0.11,largo,0.11);
    laser.extremo.position.z=0.31+largo;
    laser.extremo.scale.setScalar(0.9+0.1*Math.sin(laser.pulso*7));
    laser.brillo.material.opacity=0.38+0.05*Math.sin(laser.pulso*11);
    laser.luz.intensity=1.8+0.3*Math.sin(laser.pulso*7);
}

function actualizarLaseres(delta){
    for(var i=0;i<laseres.length;i++){
        var laser=laseres[i];
        laser.cambio-=delta;
        if(laser.cambio<=0){
            if(laser.objetivo==ajustesLaser.lenta){
                laser.objetivo=ajustesLaser.rapida;
            }else{
                laser.objetivo=ajustesLaser.lenta;
            }
            laser.cambio=tiempoAleatorio(2.5,5);
        }
        laser.velocidad+=(laser.objetivo-laser.velocidad)*Math.min(1,2*delta);
        laser.fase+=laser.velocidad*delta;
        laser.pulso+=delta;
        colocarLaser(laser);
    }
}

function tocaLaser(){
    var radio=ajustesLaser.radioJugador;
    var inferior=jugador.position.y+radio;
    var superior=jugador.position.y+movimiento.altura-radio;
    for(var i=0;i<laseres.length;i++){
        var laser=laseres[i];
        var dx=laser.final.x-laser.inicio.x;
        var dz=laser.final.z-laser.inicio.z;
        var px=jugador.position.x-laser.inicio.x;
        var pz=jugador.position.z-laser.inicio.z;
        var longitudCuadrado=dx*dx+dz*dz;
        var recorrido=0;
        if(longitudCuadrado>0){
            recorrido=(px*dx+pz*dz)/longitudCuadrado;
        }
        recorrido=Math.max(0,Math.min(1,recorrido));
        var x=laser.inicio.x+dx*recorrido;
        var z=laser.inicio.z+dz*recorrido;
        var y=Math.max(inferior,Math.min(superior,laser.inicio.y));
        var distanciaX=jugador.position.x-x;
        var distanciaZ=jugador.position.z-z;
        var distanciaY=y-laser.inicio.y;
        var distanciaCuadrado=distanciaX*distanciaX+distanciaZ*distanciaZ+distanciaY*distanciaY;
        var radioTotal=radio+ajustesLaser.radioHaz;
        if(distanciaCuadrado<=radioTotal*radioTotal){
            return true;
        }
    }
    return false;
}

function reiniciarLaseres(){
    for(var i=0;i<laseres.length;i++){
        var laser=laseres[i];
        laser.fase=laser.dato.fase;
        laser.velocidad=ajustesLaser.lenta;
        laser.objetivo=ajustesLaser.lenta;
        laser.cambio=tiempoAleatorio(2.5,5);
        laser.pulso=0;
        colocarLaser(laser);
    }
}

function pulsarTecla(evento){
    if(evento.key=='Enter'){
        if(listo&&!evento.repeat&&(estadoPartida=='perdido'||estadoPartida=='ganado')){
            evento.preventDefault();
            reiniciarPartida();
        }
        return;
    }
    if(!listo||estadoPartida!='jugando'){
        return;
    }
    if(evento.code=='KeyW')teclas.w=true;
    if(evento.code=='KeyA')teclas.a=true;
    if(evento.code=='KeyS')teclas.s=true;
    if(evento.code=='KeyD')teclas.d=true;
    if(evento.code=='Space'&&!evento.repeat){
        pedirSalto=true;
    }
    if(evento.code=='KeyW'||evento.code=='KeyA'||evento.code=='KeyS'||evento.code=='KeyD'||evento.code=='Space'){
        evento.preventDefault();
    }
}

function soltarTecla(evento){
    if(evento.code=='KeyW')teclas.w=false;
    if(evento.code=='KeyA')teclas.a=false;
    if(evento.code=='KeyS')teclas.s=false;
    if(evento.code=='KeyD')teclas.d=false;
}

function limpiarTeclas(){
    teclas.w=false;
    teclas.a=false;
    teclas.s=false;
    teclas.d=false;
    pedirSalto=false;
}

function actualizarJugador(delta){
    direccionJugador.set(0,0,0);
    camara.getWorldDirection(frente);
    frente.y=0;
    frente.normalize();
    derecha.set(-frente.z,0,frente.x);
    if(teclas.w)direccionJugador.add(frente);
    if(teclas.s)direccionJugador.sub(frente);
    if(teclas.d)direccionJugador.add(derecha);
    if(teclas.a)direccionJugador.sub(derecha);
    direccionJugador.normalize();
    var xAnterior=jugador.position.x;
    var zAnterior=jugador.position.z;
    jugador.position.x+=direccionJugador.x*movimiento.velocidad*delta;
    jugador.position.z+=direccionJugador.z*movimiento.velocidad*delta;
    jugador.position.x=Math.max(-medidas.largo/2+0.6,Math.min(medidas.meta,jugador.position.x));
    jugador.position.z=Math.max(-medidas.ancho/2+0.6,Math.min(medidas.ancho/2-0.6,jugador.position.z));
    var dx=jugador.position.x-xAnterior;
    var dz=jugador.position.z-zAnterior;
    moviendo=Math.sqrt(dx*dx+dz*dz)>0.00001;
    if(moviendo){
        var giro=Math.atan2(direccionJugador.x,direccionJugador.z)+movimiento.giro;
        var diferencia=giro-jugador.rotation.y;
        while(diferencia>Math.PI)diferencia-=2*Math.PI;
        while(diferencia<-Math.PI)diferencia+=2*Math.PI;
        jugador.rotation.y+=diferencia*Math.min(1,12*delta);
    }
    if(pedirSalto&&enSuelo){
        velocidadVertical=movimiento.salto;
        enSuelo=false;
    }
    pedirSalto=false;
    actualizarSalto(delta);
    if(!enSuelo){
        cambiarAnimacionJugador('saltar');
    }else if(moviendo){
        cambiarAnimacionJugador('caminar');
    }else{
        cambiarAnimacionJugador('quieto');
    }
    accionesJugador.saltar.setEffectiveTimeScale(accionesJugador.saltar.getClip().duration/(2*movimiento.salto/movimiento.gravedad));
    mezcladorJugador.update(delta);
}

function actualizarSalto(delta){
    if(!enSuelo){
        jugador.position.y+=velocidadVertical*delta-0.5*movimiento.gravedad*delta*delta;
        velocidadVertical-=movimiento.gravedad*delta;
        if(jugador.position.y<=0){
            jugador.position.y=0;
            velocidadVertical=0;
            enSuelo=true;
        }
    }
}

function cambiarAnimacionJugador(nombre){
    if(animacionJugador==nombre){
        return;
    }
    accionesJugador[animacionJugador].stop();
    accionesJugador[nombre].reset();
    accionesJugador[nombre].play();
    animacionJugador=nombre;
}

function colocarJugadorInicio(){
    limpiarTeclas();
    moviendo=false;
    enSuelo=true;
    muerteTerminada=false;
    velocidadVertical=0;
    modeloJugador.position.y=alturaModeloJugador;
    jugador.position.set(medidas.inicio,0,0);
    jugador.rotation.set(0,Math.PI/2+movimiento.giro,0);
    jugador.visible=true;
    mezcladorJugador.stopAllAction();
    accionesJugador.quieto.reset();
    accionesJugador.quieto.play();
    animacionJugador='quieto';
    mezcladorJugador.update(0);
}

function perderPartida(){
    estadoPartida='perdido';
    jugador.visible=true;
    moviendo=false;
    limpiarTeclas();
    mezcladorJugador.stopAllAction();
    accionesJugador.muerte.reset();
    accionesJugador.muerte.play();
    animacionJugador='muerte';
    tiempoLengua=0;
    pintarContador();
}

function actualizarMuerte(delta){
    if(muerteTerminada){
        return;
    }
    actualizarSalto(delta);
    mezcladorJugador.update(delta);
    jugador.updateMatrixWorld(true);
    cajaJugador.setFromObject(modeloJugador,true);
    if(cajaJugador.min.y<0){
        modeloJugador.position.y-=cajaJugador.min.y;
        jugador.updateMatrixWorld(true);
    }
    if(accionesJugador.muerte.paused&&enSuelo){
        muerteTerminada=true;
    }
}

function capturarRaton(){
    if(!listo||document.pointerLockElement==renderizador.domElement){
        return;
    }
    try{
        var solicitud=renderizador.domElement.requestPointerLock();
        if(solicitud!=null&&solicitud.catch!=null){
            solicitud.catch(errorRaton);
        }
    }catch(error){
        errorRaton();
    }
}

function errorRaton(){
    console.warn('No se ha podido capturar el ratón. Vuelve a hacer clic en el escenario.');
}

function moverRaton(evento){
    if(!listo||document.pointerLockElement!=renderizador.domElement){
        return;
    }
    anguloCamara-=evento.movementX*0.004;
    elevacionCamara+=evento.movementY*0.003;
    elevacionCamara=Math.max(0.1,Math.min(1.05,elevacionCamara));
}

function acercarCamara(evento){
    if(!listo){
        return;
    }
    evento.preventDefault();
    distanciaCamara+=evento.deltaY*0.005;
    distanciaCamara=Math.max(3,Math.min(9,distanciaCamara));
}

function actualizarCamara(delta){
    objetivoCamara.copy(jugador.position);
    objetivoCamara.y+=1.25;
    var horizontal=Math.cos(elevacionCamara)*distanciaCamara;
    posicionCamara.set(objetivoCamara.x+Math.sin(anguloCamara)*horizontal,objetivoCamara.y+Math.sin(elevacionCamara)*distanciaCamara,objetivoCamara.z+Math.cos(anguloCamara)*horizontal);
    posicionCamara.x=Math.max(-medidas.largo/2+0.35,Math.min(medidas.largo/2-0.35,posicionCamara.x));
    posicionCamara.y=Math.max(0.4,Math.min(medidas.alto-0.35,posicionCamara.y));
    posicionCamara.z=Math.max(-medidas.ancho/2+0.35,Math.min(medidas.ancho/2-0.35,posicionCamara.z));
    var factor=Math.min(1,12*delta);
    if(primeraCamara){
        factor=1;
    }
    camara.position.x+=(posicionCamara.x-camara.position.x)*factor;
    camara.position.y+=(posicionCamara.y-camara.position.y)*factor;
    camara.position.z+=(posicionCamara.z-camara.position.z)*factor;
    camara.lookAt(objetivoCamara);
    primeraCamara=false;
}

function vistaJugador(){
    if(!listo){
        return;
    }
    anguloCamara=-Math.PI/2;
    elevacionCamara=0.35;
    distanciaCamara=5.5;
    primeraCamara=true;
    actualizarCamara(0);
}

function reiniciarPartida(){
    estadoPartida='jugando';
    tiempoPartida=0;
    inmunidadLaser=0;
    colocarJugadorInicio();
    estadoMuneca='verde';
    tiempoMuneca=0;
    tiempoLengua=0;
    duracionMuneca=tiempoAleatorio(ritmo.verdeMin,ritmo.verdeMax);
    textoContadorAnterior='';
    actualizarMuneca(0);
    reiniciarLaseres();
    vistaJugador();
}

function actualizarPartida(delta){
    if(estadoPartida=='perdido'){
        actualizarMuerte(delta);
        actualizarMuneca(delta);
        return;
    }
    if(estadoPartida=='ganado'){
        return;
    }
    var mirandoAntes=munecaMirando();
    var saltandoAntes=!enSuelo;
    tiempoPartida+=delta;
    inmunidadLaser=Math.max(0,inmunidadLaser-delta);
    actualizarMuneca(delta);
    actualizarJugador(delta);
    actualizarLaseres(delta);
    jugador.visible=true;
    if(inmunidadLaser>0&&Math.floor(inmunidadLaser*10)%2!=0){
        jugador.visible=false;
    }
    if((mirandoAntes||munecaMirando())&&(moviendo||!enSuelo||saltandoAntes)){
        perderPartida();
        return;
    }
    if(inmunidadLaser==0&&tocaLaser()){
        colocarJugadorInicio();
        inmunidadLaser=ajustesLaser.inmunidad;
        vistaJugador();
        return;
    }
    if(jugador.position.x>=medidas.meta){
        estadoPartida='ganado';
        jugador.visible=true;
        limpiarTeclas();
    }
}

function calcularEstrellas(){
    var segundos=Math.round(tiempoPartida*100)/100;
    if(segundos<=limitesEstrellas[0])return 5;
    if(segundos<=limitesEstrellas[1])return 4;
    if(segundos<=limitesEstrellas[2])return 3;
    if(segundos<=limitesEstrellas[3])return 2;
    return 1;
}

function pintarResultado(){
    var ancho=lienzoResultado.width;
    var alto=lienzoResultado.height;
    dibujoResultado.clearRect(0,0,ancho,alto);
    if(estadoPartida!='ganado'&&estadoPartida!='perdido'){
        return;
    }
    var x=ancho/2;
    var y=alto/2;
    var factor=Math.min(1,ancho/600,alto/360);
    dibujoResultado.save();
    dibujoResultado.translate(x,y);
    dibujoResultado.scale(factor,factor);
    dibujoResultado.fillStyle='rgba(0,0,0,0.85)';
    dibujoResultado.fillRect(-260,-130,520,260);
    dibujoResultado.textAlign='center';
    dibujoResultado.textBaseline='middle';
    dibujoResultado.fillStyle='white';
    dibujoResultado.font='bold 34px Arial';
    if(estadoPartida=='ganado'){
        dibujoResultado.fillText('¡Has finalizado!',0,-75);
    }else{
        dibujoResultado.fillText('La muñeca te ha visto',0,-75);
    }
    dibujoResultado.font='22px Arial';
    dibujoResultado.fillText('Tiempo: '+tiempoPartida.toFixed(2).replace('.',',')+' segundos',0,-25);
    if(estadoPartida=='ganado'){
        var estrellas=calcularEstrellas();
        var texto='';
        for(var i=0;i<5;i++){
            if(i<estrellas){
                texto+='★';
            }else{
                texto+='☆';
            }
        }
        dibujoResultado.fillStyle='#ffd54a';
        dibujoResultado.font='42px Arial';
        dibujoResultado.fillText(texto,0,25);
    }
    dibujoResultado.fillStyle='white';
    dibujoResultado.font='20px Arial';
    dibujoResultado.fillText('Pulsa Intro para volver a jugar',0,85);
    dibujoResultado.restore();
}

function updateAspectRatio(){
    renderizador.setSize(window.innerWidth,window.innerHeight);
    camara.aspect=window.innerWidth/window.innerHeight;
    camara.updateProjectionMatrix();
    lienzoResultado.width=window.innerWidth;
    lienzoResultado.height=window.innerHeight;
}

function update(){
    var delta=Math.min(reloj.getDelta(),0.1);
    if(listo){
        var pasos=Math.max(1,Math.ceil(delta/(1/120)));
        for(var i=0;i<pasos;i++){
            actualizarPartida(delta/pasos);
        }
        actualizarCamara(delta);
    }
}

function render(){
    requestAnimationFrame(render);
    update();
    renderizador.render(escena,camara);
    pintarResultado();
}
