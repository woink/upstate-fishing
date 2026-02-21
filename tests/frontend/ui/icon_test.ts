import { describe, it } from '@std/testing/bdd';
import { assert, assertEquals } from '@std/assert';
import { Icon, ICON_NAMES } from '../../../components/ui/Icon.tsx';

describe('Icon component', () => {
  describe('rendering', () => {
    it('renders an svg element', () => {
      const vnode = Icon({ name: 'fish' });
      assertEquals(vnode.type, 'svg');
    });

    it('applies default size of 20 (md)', () => {
      const vnode = Icon({ name: 'fish' });
      assertEquals(vnode.props.width, 20);
      assertEquals(vnode.props.height, 20);
    });

    it('applies sm size of 16', () => {
      const vnode = Icon({ name: 'fish', size: 'sm' });
      assertEquals(vnode.props.width, 16);
      assertEquals(vnode.props.height, 16);
    });

    it('applies lg size of 24', () => {
      const vnode = Icon({ name: 'fish', size: 'lg' });
      assertEquals(vnode.props.width, 24);
      assertEquals(vnode.props.height, 24);
    });

    it('sets viewBox to 0 0 24 24', () => {
      const vnode = Icon({ name: 'fish' });
      assertEquals(vnode.props.viewBox, '0 0 24 24');
    });

    it('sets stroke styling for lucide icons', () => {
      const vnode = Icon({ name: 'fish' });
      assertEquals(vnode.props.fill, 'none');
      assertEquals(vnode.props.stroke, 'currentColor');
      assertEquals(vnode.props['stroke-width'], '2');
    });

    it('passes through class prop', () => {
      const vnode = Icon({ name: 'fish', class: 'text-red-500' });
      assert(
        String(vnode.props.class || '').includes('text-red-500'),
        'should include custom class',
      );
    });

    it('sets aria-label when provided', () => {
      const vnode = Icon({ name: 'fish', 'aria-label': 'Fish icon' });
      assertEquals(vnode.props['aria-label'], 'Fish icon');
    });

    it('sets aria-hidden when no aria-label', () => {
      const vnode = Icon({ name: 'fish' });
      assertEquals(vnode.props['aria-hidden'], 'true');
    });
  });

  describe('icon catalog', () => {
    const requiredIcons = [
      'fish',
      'droplets',
      'thermometer',
      'waves',
      'star',
      'refresh-cw',
      'cloud-sun',
      'sun',
      'sunrise',
      'sunset',
      'clock',
      'map-pin',
      'bug',
      'alert-triangle',
      'x-circle',
      'thumbs-up',
      'target',
      'cloud',
      'search',
    ];

    for (const name of requiredIcons) {
      it(`includes "${name}" icon`, () => {
        assert(
          ICON_NAMES.includes(name),
          `ICON_NAMES should include "${name}"`,
        );
      });
    }

    it('has at least 19 icons', () => {
      assert(ICON_NAMES.length >= 19, `should have at least 19 icons, got ${ICON_NAMES.length}`);
    });
  });
});
