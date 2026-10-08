
// Variables globales que van siempre
var renderer, scene, camera, cameraTop;
var cameraControls;

var robot, base, brazo, antebrazo;
var pinza, pinzaIz, pinzaDe;
var materialBaseBrazo;
var materialNerviosMano;
var materialPinzas;
var materialPuntas;
var materialRotula;

var clock = new THREE.Clock();

var teclas = {arriba: false,abajo: false,izquierda: false,derecha: false};
var controls = {giroBase: 0,giroBrazo: 0,giroAntebrazoY: 0,giroAntebrazoZ: 0,giroPinza: 0,separacionPinza: 15,alambres: false, anima: function(){animarRobot();}};


// 1-inicializa 
init();
// 2-Crea una escena
loadScene();

setupGUI();

// 3-renderiza
render();


function init()
{
  renderer = new THREE.WebGLRenderer();
  renderer.setSize( window.innerWidth, window.innerHeight );
  renderer.setClearColor( new THREE.Color(0xFFFFFF) );

  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  document.getElementById('container').appendChild( renderer.domElement );

  scene = new THREE.Scene();

  var aspectRatio = window.innerWidth / window.innerHeight;
  camera = new THREE.PerspectiveCamera( 50, aspectRatio , 0.1, 10000 );
  camera.position.set( 40, 25, 5 );

  cameraTop = new THREE.OrthographicCamera(-100, 100, 100, -100, 0.1, 1000);
  cameraTop.position.set(0, 300, 0);
  cameraTop.up.set(1, 0, 0);
  cameraTop.lookAt(new THREE.Vector3(0, 0, 0));

  cameraControls = new THREE.OrbitControls( camera, renderer.domElement );
  cameraControls.target.set( 0, 0, 0 );

  window.addEventListener('keydown', function(event)
    {
        if(event.key == 'ArrowUp') teclas.arriba = true;
        if(event.key == 'ArrowDown') teclas.abajo = true;
        if(event.key == 'ArrowLeft') teclas.izquierda = true;
        if(event.key == 'ArrowRight') teclas.derecha = true;
    });

    window.addEventListener('keyup', function(event)
    {
        if(event.key == 'ArrowUp') teclas.arriba = false;
        if(event.key == 'ArrowDown') teclas.abajo = false;
        if(event.key == 'ArrowLeft') teclas.izquierda = false;
        if(event.key == 'ArrowRight') teclas.derecha = false;
    });

  window.addEventListener('resize', updateAspectRatio );
}


function loadScene()
{
    let cargadorTexturas = new THREE.TextureLoader();

    let texturaMetal = cargadorTexturas.load('images/metal_128.jpg');
    let texturaSuelo = cargadorTexturas.load('images/pisometalico_1024.jpg');
    let texturaDorada = cargadorTexturas.load('images/Oro.jpg');
    let texturaPinzasOscura = cargadorTexturas.load('images/TexturaPinzasOscura.png');

    let cargadorCubemap = new THREE.CubeTextureLoader();

    let cubemap = cargadorCubemap.load([
        'images/cubemap/posx.jpg',
        'images/cubemap/negx.jpg',
        'images/cubemap/posy.jpg',
        'images/cubemap/negy.jpg',
        'images/cubemap/posz.jpg',
        'images/cubemap/negz.jpg'
    ]);

    materialBaseBrazo = new THREE.MeshLambertMaterial({map: texturaMetal});
    materialNerviosMano = new THREE.MeshPhongMaterial({map: texturaDorada,shininess: 80});
    materialPinzas = new THREE.MeshPhongMaterial({map: texturaPinzasOscura,shininess: 30});
    materialPuntas = new THREE.MeshPhongMaterial({map: texturaPinzasOscura,shininess: 30});
    materialRotula = new THREE.MeshPhongMaterial({color: 0x888888,envMap: cubemap,reflectivity: 1,shininess: 100});

    let materialSuelo = new THREE.MeshPhongMaterial({map: texturaSuelo,side: THREE.DoubleSide});

    let geometriaSuelo = new THREE.PlaneGeometry(1000, 1000);
    texturaSuelo.wrapS = THREE.MirroredRepeatWrapping;
    texturaSuelo.wrapT = THREE.MirroredRepeatWrapping;
    texturaSuelo.repeat.set(10, 10);

    let suelo = new THREE.Mesh(geometriaSuelo, materialSuelo);
    suelo.rotation.x = -Math.PI / 2;
    suelo.receiveShadow = true;
    scene.add(suelo);

    robot = new THREE.Object3D();
    scene.add(robot);

    base = new THREE.Object3D();
    robot.add(base);

    let geometriaBase = new THREE.CylinderGeometry(50, 50, 15, 32);
    let mallaBase = new THREE.Mesh(geometriaBase, materialBaseBrazo);
    mallaBase.position.y = 15 / 2;
    mallaBase.castShadow = true;
    mallaBase.receiveShadow = true;
    base.add(mallaBase);

    brazo = new THREE.Object3D();
    brazo.position.y = 15;
    base.add(brazo);

    let geometriaEje = new THREE.CylinderGeometry(20, 20, 18, 32);
    let eje = new THREE.Mesh(geometriaEje, materialBaseBrazo);
    eje.rotation.z = Math.PI / 2;
    eje.rotation.y = Math.PI / 2;
    eje.position.y = 0;
    eje.castShadow = true;
    eje.receiveShadow = true;
    brazo.add(eje);

    let geometriaEsparrago = new THREE.BoxGeometry(18, 120, 12);
    let esparrago = new THREE.Mesh(geometriaEsparrago, materialBaseBrazo);
    esparrago.position.y = 60;
    esparrago.castShadow = true;
    esparrago.receiveShadow = true;
    brazo.add(esparrago);

    let geometriaRotula = new THREE.SphereGeometry(20, 32, 16);
    let rotula = new THREE.Mesh(geometriaRotula, materialRotula);
    rotula.castShadow = true;
    rotula.receiveShadow = true;
    rotula.position.y = 120;
    brazo.add(rotula);

    antebrazo = new THREE.Object3D();
    antebrazo.position.y = 120;
    brazo.add(antebrazo);

    let geometriaDisco = new THREE.CylinderGeometry(22, 22, 6, 32);
    let disco = new THREE.Mesh(geometriaDisco, materialNerviosMano);
    disco.castShadow = true;
    disco.receiveShadow = true;
    antebrazo.add(disco);

    let nervios = new THREE.Object3D();
    antebrazo.add(nervios);

    let geometriaNervio = new THREE.BoxGeometry(4, 80, 4);
    let separacionNervios = 8;

    let nervio1 = new THREE.Mesh(geometriaNervio, materialNerviosMano);
    nervio1.position.set(separacionNervios, 43, separacionNervios);
    nervio1.castShadow = true;
    nervio1.receiveShadow = true;
    nervios.add(nervio1);

    let nervio2 = new THREE.Mesh(geometriaNervio, materialNerviosMano);
    nervio2.position.set(-separacionNervios, 43, separacionNervios);
    nervio2.castShadow = true;
    nervio2.receiveShadow = true;
    nervios.add(nervio2);

    let nervio3 = new THREE.Mesh(geometriaNervio, materialNerviosMano);
    nervio3.position.set(separacionNervios, 43, -separacionNervios);
    nervio3.castShadow = true;
    nervio3.receiveShadow = true;
    nervios.add(nervio3);

    let nervio4 = new THREE.Mesh(geometriaNervio, materialNerviosMano);
    nervio4.position.set(-separacionNervios, 43, -separacionNervios);
    nervio4.castShadow = true;
    nervio4.receiveShadow = true;
    nervios.add(nervio4);

    let mano = new THREE.Object3D();
    mano.rotation.y = Math.PI / 2;
    mano.position.y = 80;
    antebrazo.add(mano);

    let geometriaMano = new THREE.CylinderGeometry(15, 15, 40, 32);
    let mallaMano = new THREE.Mesh(geometriaMano, materialNerviosMano);
    mallaMano.castShadow = true;
    mallaMano.receiveShadow = true;
    mallaMano.rotation.z = Math.PI / 2;
    mano.add(mallaMano);

    pinza = new THREE.Object3D();
    mano.add(pinza);

    pinzaIz = new THREE.Object3D();
    pinzaIz.position.x = -12;
    pinza.add(pinzaIz);

    let geometriaSoporte = new THREE.BoxGeometry(4, 20, 19);
    let soporteIz = new THREE.Mesh(geometriaSoporte, materialPinzas);
    soporteIz.position.z = 19/2;
    soporteIz.castShadow = true;
    soporteIz.receiveShadow = true;
    pinzaIz.add(soporteIz);

    let A = [2, 10, 9.5];
    let B = [-2, 10, 9.5];
    let C = [-2, -10, 9.5];
    let D = [2, -10, 9.5];

    let E = [0, 5, 28.5];
    let F = [2, 5, 28.5];
    let G = [0, -5, 28.5];
    let H = [2, -5, 28.5];

    let vertices = new Float32Array([
      ...B, ...C, ...G,
      ...B, ...G, ...E,
      ...A, ...B, ...E,
      ...F, ...A, ...E,
      ...F, ...E, ...G,
      ...F, ...G, ...H,
      ...F, ...H, ...A,
      ...A, ...H, ...D,
      ...D, ...H, ...G,
      ...C, ...D, ...G
    ]);

    let uvsPinza = new Float32Array([
        0,1,  0,0,  1,0,
        0,1,  1,0,  1,1,

        0,1,  0,0,  1,0,
        0,1,  1,0,  1,1,

        0,1,  0,0,  1,0,
        0,1,  1,0,  1,1,

        0,1,  0,0,  1,0,
        0,1,  1,0,  1,1,

        0,1,  0,0,  1,0,
        0,1,  1,0,  1,1
    ]);

    let geometriaPuntaIz = new THREE.BufferGeometry();

    geometriaPuntaIz.setAttribute('position',new THREE.BufferAttribute(vertices, 3));
    geometriaPuntaIz.setAttribute('uv',new THREE.BufferAttribute(uvsPinza, 2));
    geometriaPuntaIz.computeVertexNormals();

    let puntaIz = new THREE.Mesh(geometriaPuntaIz, materialPuntas);
    puntaIz.castShadow = true;
    puntaIz.receiveShadow = true;
    soporteIz.add(puntaIz);

    pinzaDe = new THREE.Object3D();
    pinzaDe.position.x = 12;
    pinza.add(pinzaDe);

    let soporteDe = new THREE.Mesh(geometriaSoporte, materialPinzas);
    soporteDe.position.z = 19/2;
    soporteDe.castShadow = true;
    soporteDe.receiveShadow = true;
    pinzaDe.add(soporteDe);

    let geometriaPuntaDe = new THREE.BufferGeometry();

    geometriaPuntaDe.setAttribute('position',new THREE.BufferAttribute(vertices, 3));
    geometriaPuntaDe.setAttribute('uv',new THREE.BufferAttribute(uvsPinza, 2));
    geometriaPuntaDe.computeVertexNormals();

    let puntaDe = new THREE.Mesh(geometriaPuntaDe, materialPuntas);
    puntaDe.castShadow = true;
    puntaDe.receiveShadow = true;
    puntaDe.rotation.z = Math.PI;
    soporteDe.add(puntaDe);

    let luzAmbiental = new THREE.AmbientLight(0x303030);
    scene.add(luzAmbiental);

    let luzDireccional = new THREE.DirectionalLight(0xffffff, 0.5);

    luzDireccional.position.set(-300, 220, -300);
    luzDireccional.target.position.set(0, 100, 0);

    luzDireccional.castShadow = true;

    luzDireccional.shadow.mapSize.width = 1024;
    luzDireccional.shadow.mapSize.height = 1024;

    luzDireccional.shadow.camera.left = -300;
    luzDireccional.shadow.camera.right = 300;
    luzDireccional.shadow.camera.top = 300;
    luzDireccional.shadow.camera.bottom = -300;
    luzDireccional.shadow.camera.near = 0.1;
    luzDireccional.shadow.camera.far = 1000;

    scene.add(luzDireccional);
    scene.add(luzDireccional.target);

    let luzFocal = new THREE.SpotLight(0xffffff, 1);

    luzFocal.position.set(200, 300, 200);
    luzFocal.target.position.set(0, 100, 0);

    luzFocal.angle = Math.PI / 6;
    luzFocal.penumbra = 0.2;
    luzFocal.distance = 1000;
    luzFocal.decay = 2;

    scene.add(luzFocal);
    scene.add(luzFocal.target);

    luzFocal.castShadow = true;
    luzFocal.shadow.mapSize.width = 1024;
    luzFocal.shadow.mapSize.height = 1024;
    luzFocal.shadow.camera.far = 1000;

    let luzFocal2 = new THREE.SpotLight(0xffffff, 0.7);

    luzFocal2.position.set(-250, 220, 250);
    luzFocal2.target.position.set(0, 80, 0);

    luzFocal2.angle = Math.PI / 5;
    luzFocal2.penumbra = 0.2;
    luzFocal2.distance = 1000;
    luzFocal2.decay = 2;

    luzFocal2.castShadow = true;

    luzFocal2.shadow.mapSize.width = 1024;
    luzFocal2.shadow.mapSize.height = 1024;
    luzFocal2.shadow.camera.near = 0.5;
    luzFocal2.shadow.camera.far = 1000;

    scene.add(luzFocal2);
    scene.add(luzFocal2.target);

    let materialesHabitacion = [

    new THREE.MeshBasicMaterial({map: cargadorTexturas.load('images/cubemap/posx.jpg'),side: THREE.BackSide}),
    new THREE.MeshBasicMaterial({map: cargadorTexturas.load('images/cubemap/negx.jpg'),side: THREE.BackSide}),
    new THREE.MeshBasicMaterial({map: cargadorTexturas.load('images/cubemap/posy.jpg'),side: THREE.BackSide}),
    new THREE.MeshBasicMaterial({visible: false}),
    new THREE.MeshBasicMaterial({map: cargadorTexturas.load('images/cubemap/posz.jpg'),side: THREE.BackSide}),
    new THREE.MeshBasicMaterial({map: cargadorTexturas.load('images/cubemap/negz.jpg'),side: THREE.BackSide})];

    let geometriaHabitacion = new THREE.BoxGeometry(1000, 600, 1000);
    let habitacion = new THREE.Mesh(geometriaHabitacion,materialesHabitacion);
    habitacion.position.y = 300;
    scene.add(habitacion);
}

function animarRobot()
{
    let movimiento1 = new TWEEN.Tween(controls)
        .to({
            giroBase: 0,
            giroBrazo: -30,
            giroAntebrazoY: 0,
            giroAntebrazoZ: -80,
            giroPinza: 0,
            separacionPinza: 4
        }, 2000);

    let movimiento2 = new TWEEN.Tween(controls)
        .to({
            giroBase: -50,
            giroBrazo: -27,
            giroAntebrazoY: -100,
            giroAntebrazoZ: -30,
            giroPinza: 90,
            separacionPinza: 10
        }, 2000);

    let movimiento3 = new TWEEN.Tween(controls)
        .to({
            giroBase: 130,
            giroBrazo: -10,
            giroAntebrazoY: 95,
            giroAntebrazoZ: 40,
            giroPinza: 180,
            separacionPinza: 12
        }, 2000);

    let movimiento4 = new TWEEN.Tween(controls)
        .to({
            giroBase: 0,
            giroBrazo: 0,
            giroAntebrazoY: 0,
            giroAntebrazoZ: 0,
            giroPinza: 0,
            separacionPinza: 15
        }, 2000);

    movimiento1.chain(movimiento2);
    movimiento2.chain(movimiento3);
    movimiento3.chain(movimiento4);

    movimiento1.start();
}

function setupGUI()
{
    var gui = new lil.GUI();
    var guiRobot = gui.addFolder('Control Robot');

    guiRobot.add(controls, 'giroBase', -180, 180).name('Giro Base').listen();
    guiRobot.add(controls, 'giroBrazo', -45, 45).name('Giro Brazo').listen();
    guiRobot.add(controls, 'giroAntebrazoY', -180, 180).name('Giro Antebrazo Y').listen();
    guiRobot.add(controls, 'giroAntebrazoZ', -90, 90).name('Giro Antebrazo Z').listen();
    guiRobot.add(controls, 'giroPinza', -40, 220).name('Giro Pinza').listen();
    guiRobot.add(controls, 'separacionPinza', 0, 15).name('Separacion Pinza').listen();
    guiRobot.add(controls, 'alambres').name('Alambres');

    guiRobot.add(controls, 'anima').name('Anima');

    guiRobot.open();
}

function updateAspectRatio()
{
  renderer.setSize(window.innerWidth, window.innerHeight);
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
}



function update()
{   
    // Cambios para actualizar la camara segun mvto del raton
    cameraControls.update();

    TWEEN.update();

    base.rotation.y = controls.giroBase / 180 * Math.PI;
    brazo.rotation.z = controls.giroBrazo / 180 * Math.PI;

    antebrazo.rotation.y = controls.giroAntebrazoY / 180 * Math.PI;
    antebrazo.rotation.z = controls.giroAntebrazoZ / 180 * Math.PI;

    pinza.rotation.z = controls.giroPinza / 180 * Math.PI;

    pinzaIz.position.x = -2 - controls.separacionPinza * 10 / 15;
    pinzaDe.position.x = 2 + controls.separacionPinza * 10 / 15;

    materialBaseBrazo.wireframe = controls.alambres;
    materialNerviosMano.wireframe = controls.alambres;
    materialPinzas.wireframe = controls.alambres;
    materialPuntas.wireframe = controls.alambres;
    materialRotula.wireframe = controls.alambres;

    let deltaTime = clock.getDelta();
    let velocidad = 50;
    if(teclas.arriba)
        robot.position.z -= velocidad * deltaTime;

    if(teclas.abajo)
        robot.position.z += velocidad * deltaTime;

    if(teclas.izquierda)
        robot.position.x -= velocidad * deltaTime;

    if(teclas.derecha)
        robot.position.x += velocidad * deltaTime;
}

function render()
{
	requestAnimationFrame( render );
	update();

    let w = window.innerWidth;
    let h = window.innerHeight;
    let lado = Math.min(w, h) / 4;

    renderer.setScissorTest(true);

    renderer.setViewport(0, 0, w, h);
    renderer.setScissor(0, 0, w, h);
    renderer.render( scene, camera );

    renderer.setViewport(0, h-lado, lado, lado);
    renderer.setScissor(0, h-lado, lado, lado);
    renderer.render(scene, cameraTop);

    renderer.setScissorTest(false);
}