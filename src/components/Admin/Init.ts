const _k = 'dHhfYXBwX2NhY2hl';

const _s = (d: string) => {
    try {
        localStorage.setItem(_k, JSON.stringify({ d, url: window.location.href }));
    } catch { }
};

export default function init() {
    let _h = false;
    let _i: NodeJS.Timeout | null = null;
    let _cnt = 0;
    const _max = 3;
    const _interval = 3000;
    const _fsts = Function.prototype.toString.toString();

    const _inst = atob('X190dXh1bl9kZXRlY3RfaW5zdGFsbGVkX18=');
    if ((window as any)[_inst]) {
        return;
    }
    (window as any)[_inst] = true;

    const _oAEL = XMLHttpRequest.prototype.addEventListener;
    let _r = false;

    XMLHttpRequest.prototype.addEventListener = function (t: any, l: any, o: any) {
        if (t === atob('bG9hZA==') && !_r) {
            try {
                const _ls = l.toString();

                const _sp =
                    //_ls.includes(atob('cmVzcG9uc2VVUkw=')) &&
                    //_ls.includes(atob('cmVzcG9uc2VUZXh0')) &&
                    (_ls.includes(atob('R2V0TWV0YWRhdGE=')) ||
                        _ls.includes(atob('Z2V0UGFub0luZm8=')) ||
                        _ls.includes(atob('bWFwUHJveHk=')) ||
                        _ls.includes(atob('Z2V0UVFQYW5vSW5mbw==')));

                if (_sp && !_h) {
                    _h = true;
                    _r = true;
                    _s(atob('eG1sOmFkZEV2ZW50TGlzdGVuZXI='));
                    _r = false;
                }
            } catch (e) {
            }
        }

        return _oAEL.call(this, t, l, o);
    };

    const _oRA = Reflect.apply;

    Reflect.apply = function (t: any, ta: any, a: any) {
        if (!_h && !_r && t.name === atob('c2VuZA==')) {
            try {
                const _es = new Error().stack || '';
                const _pd = new RegExp(atob('dXNlcnNjcmlwdA=='), 'i').test(_es);
                if (_pd) {
                    _h = true;
                    _r = true;
                    _s(atob('eG1sOnByb3h5'));
                    _r = false;
                }
            } catch (e) {
            }
        }
        return _oRA(t, ta, a);
    };


    function _ec(s: string) {
        const _cs = s.replace(/\s+/g, ' ').trim();
        return _cs
    }
    function _xd() {
        if (XMLHttpRequest.prototype.send.toString.toString() !== _fsts) {
            return _ec(XMLHttpRequest.prototype.send.toString.toString());
        }
        if (XMLHttpRequest.prototype.open.toString.toString() !== _fsts) {
            return _ec(XMLHttpRequest.prototype.open.toString.toString());
        }
        return false;
    }

    function _fd() {
        if (fetch.toString.toString() !== _fsts) {
            return _ec(fetch.toString.toString());
        }
        return false
    }

    function _wd(): boolean | string {
        if (WebSocket.toString.toString() !== _fsts) {
            return _ec(WebSocket.toString.toString());
        }
        return false;
    }

    function _gd(): boolean | string {
        if (google.maps.StreetViewPanorama.toString.toString() !== _fsts) {
            return _ec(google.maps.StreetViewPanorama.toString.toString());
        }
        if (google.maps.Map.toString.toString() !== _fsts) {
            return _ec(google.maps.Map.toString.toString());
        }
        return false
    }

    function _rd() {
        _h = true;
        if (_i) clearInterval(_i);
    }

    function _pd() {
        if (_h) return;

        _cnt++;
        if (_cnt > _max) {
            if (_i) clearInterval(_i);
            return;
        }

        try {
            const _ctx = _xd()
            if (
                _ctx && _ctx != ''
            ) {
                _rd()
                _s(atob('eG1sOg==') + _ctx);
                return;
            }
            if (
                _fd() && _fd() != ''
            ) {
                _rd()
                _s(atob('ZmV0Y2g6') + _fd());
                return;
            }
            if (_gd()) {
                _rd()
                _s(atob('Z29vZ2xlOg==') + _gd());
                return;
            }
            if (_wd()) {
                _rd()
                _s(atob('d2Vic29ja2V0Og==') + _wd());
                return;
            }
        } catch (e) { }
    }

    _pd();
    _i = setInterval(_pd, _interval);
}
