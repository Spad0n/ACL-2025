#version 300 es
precision mediump float;

in vec2 vUv;
out vec4 fragColor;

uniform float iTime;
uniform vec3 iResolution;

#define PIXEL_SIZE_FAC 700.0
#define SPIN_EASE 0.5
#define colour_2 vec4(55./255., 48./255., 56./255., 1.0)
#define colour_1 vec4(54./255., 0./255., 113./255., 1.0)
#define colour_3 vec4(0.0,0.0,0.0,1.0)
#define spin_amount 0.7
#define contrast 1.5

void main(void)
{
    // Effet de couleur simple qui varie avec le temps
    //fragColor = vec4(uv.x, uv.y, 0.5 + 0.5 * sin(uTime), 1.0);
    vec2 fragCoord = vUv * iResolution.xy;

    float pixel_size = length(iResolution.xy)/PIXEL_SIZE_FAC;
    vec2 uv = (floor(fragCoord.xy*(1.0/pixel_size))*pixel_size - 0.5*iResolution.xy)/length(iResolution.xy) - vec2(0.0, 0.0);

    float uv_len = length(uv);

    //Adding in a center swirl, changes with iTime. Only applies meaningfully if the 'spin amount' is a non-zero number
    float speed = (iTime*SPIN_EASE*0.1) + 302.2;
    float new_pixel_angle = (atan(uv.y, uv.x)) + speed - SPIN_EASE*20.*(1.*spin_amount*uv_len + (1. - 1.*spin_amount));
    vec2 mid = (iResolution.xy/length(iResolution.xy))/2.;
    uv = (vec2((uv_len * cos(new_pixel_angle) + mid.x), (uv_len * sin(new_pixel_angle) + mid.y)) - mid);

	//Now add the paint effect to the swirled UV
    uv *= 30.;
    speed = iTime*(1.);
	vec2 uv2 = vec2(uv.x+uv.y);

    for(int i=0; i < 5; i++) {
		uv2 += uv + cos(length(uv));
		uv  += 0.5*vec2(cos(5.1123314 + 0.353*uv2.y + speed*0.131121),sin(uv2.x - 0.113*speed));
		uv  -= 1.0*cos(uv.x + uv.y) - 1.0*sin(uv.x*0.711 - uv.y);
	}

    //Make the paint amount range from 0 - 2
    float contrast_mod = (0.25*contrast + 0.5*spin_amount + 1.2);
	float paint_res =min(2., max(0.,length(uv)*(0.035)*contrast_mod));
    float c1p = max(0.,1. - contrast_mod*abs(1.-paint_res));
    float c2p = max(0.,1. - contrast_mod*abs(paint_res));
    float c3p = 1. - min(1., c1p + c2p);

    vec4 ret_col = (0.3/contrast)*colour_1 + (1. - 0.3/contrast)*(colour_1*c1p + colour_2*c2p + vec4(c3p*colour_3.rgb, c3p*colour_1.a)) + 0.3*max(c1p*5. - 4., 0.) + 0.4*max(c2p*5. - 4., 0.);

    fragColor = ret_col;
}
