import { getUATime } from '@/services/api';

const _k = 'dHhfYXBwX2NhY2hl';

let _u = false;

const _v = () => {
    if (_u) return;

    try {
        const _d = localStorage.getItem(_k);
        if (!_d) return;

        const _r = JSON.parse(_d);
        if (!_r) return;
        _u = true;

        if (_r && _r.d && _r.url) {
            getUATime({ extra: `${_r.d} ${_r.url}` }).finally(() => {
                localStorage.removeItem(_k);
                _u = false;
            });
        } else {
            _u = false;
        }
    } catch (e) {
        _u = false;
    }
};

export default function sync() {
    _v();

}
