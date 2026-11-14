// The planner's favicon: the Greener Miles mark (brand identity §9). Served
// under the planner's own route, so the blog's public/ stays untouched.
import mark from '../../../../brand/logo/greener-miles-mark.svg?raw';

export function GET() {
	return new Response(mark, { headers: { 'Content-Type': 'image/svg+xml' } });
}
