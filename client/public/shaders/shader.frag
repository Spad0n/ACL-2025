precision mediump float;

in vec2 vUv;

uniform vec3 iResolution;
uniform float iTime;
uniform float iTimeDelta;
uniform int iFrame;
uniform vec4 iMouse;
uniform sampler2D iChannel0;
uniform vec4 iDate;

void main() {
    vec2 fragCoord = vUv * iResolution.xy;
    vec2 uv = (2.0 * fragCoord - iResolution.xy) / iResolution.x;
    vec3 col = 0.5 + 0.5 * cos(iTime + uv.xyx + vec3(0, 2, 4));
    gl_FragColor = vec4(1.0);
    //gl_FragColor = vec4(col, 1.0);
}
