import { Application, Container, Geometry, Mesh, Shader } from "pixi.js";

/**
 * @typedef {import("pixi.js").Renderer} Renderer
 */

/**
 * @param {Application<Renderer>} app
 */
export async function initBackground(app) {
    const backgroundContainer = new Container();
    app.stage.addChild(backgroundContainer);
    const [vertexShader, fragmentShader] = await Promise.all([
        fetch('/shaders/background.vert').then(response => response.text()),
        fetch('/shaders/background.frag').then(response => response.text())
    ]);

    const uniforms = {
        iTime: {value: 0.0, type: "f32"},
        iResolution: {value: [app.screen.width, app.screen.height, 1], type: "vec3<f32>"}
    };

    const geometry = new Geometry();
    geometry.addAttribute('aPosition', [
	0, app.screen.height,
	app.screen.width, app.screen.height,
	app.screen.width, 0,
	0, 0,
    ]);
    geometry.addAttribute('aUv', [
	0, 0, // UV pour le coin haut gauche
	1, 0, // UV pour le coin haut droit
	1, 1, // UV pour le coin bas droit
	0, 1, // UV pour le coin bas gauche
    ]);
    geometry.addIndex([0, 1, 2, 0, 2, 3]);

    const shader = Shader.from({
        gl: {
            vertex: vertexShader,
            fragment: fragmentShader,
        },
        resources: {
            uniforms
        }
    });

    const backgroundMesh = new Mesh({
        geometry: geometry,
        shader: shader,
    });
    backgroundContainer.addChild(backgroundMesh);

    app.ticker.add((ticker) => {
        const uniforms = shader.resources.uniforms.uniforms;
        uniforms.iTime += ticker.deltaMS / 1000.0;
    });

    app.renderer.on("resize", () => {
	const width = app.screen.width;
	const height = app.screen.height;
	const positionBuffer = backgroundMesh.geometry.getBuffer("aPosition");

	positionBuffer.data.set([
	    0, height,
	    width, height,
	    width, 0,
	    0, 0,
	]);
	positionBuffer.update();
	shader.resources.uniforms.uniforms.iResolution = [width, height, 1];
    });
}
