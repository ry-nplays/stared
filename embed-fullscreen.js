// embed-fullscreen.js
// Finds the first iframe in the document and adds a floating fullscreen toggle button.
(function(){
    function createButton(){
        const btn = document.createElement('button');
        btn.className = 'embed-fullscreen-btn';
        btn.type = 'button';
        btn.title = 'Toggle fullscreen';
        btn.innerHTML = '\u26F6'; // simple icon (expand)
        return btn;
    }

    function enableFullscreen(iframe, btn){
        let isFullscreen = false;

        // Helper to save current inline styles so we can restore them
        function saveInlineStyles(el){
            const props = ['width','height','maxWidth','maxHeight','borderRadius','boxShadow'];
            const saved = {};
            props.forEach(p => saved[p] = el.style[p] || '');
            el.dataset._prevStyles = JSON.stringify(saved);
        }

        function restoreInlineStyles(el){
            try{
                const saved = JSON.parse(el.dataset._prevStyles || '{}');
                Object.keys(saved).forEach(k => { el.style[k] = saved[k] || ''; });
                delete el.dataset._prevStyles;
            }catch(e){
                // ignore
            }
        }

        btn.addEventListener('click', async function(){
            // If already fullscreen, exit
            if(isFullscreen){
                if(document.fullscreenElement){
                    await document.exitFullscreen();
                }
                return;
            }

            // Target the iframe's parent (so the border/radius applies)
            const target = iframe.parentElement || iframe;

            // Mark the target so CSS can style it when fullscreen
            target.classList.add('embed-fullscreen-target');

            // Save inline styles for restore
            saveInlineStyles(iframe);
            saveInlineStyles(target);

            // Request fullscreen on the target element
            if(target.requestFullscreen){
                try{
                    await target.requestFullscreen();
                    // After entering fullscreen, force the iframe and target to fill
                    target.classList.add('is-fullscreen');
                    iframe.style.width = '100%';
                    iframe.style.height = '100%';
                    iframe.style.maxWidth = 'none';
                    iframe.style.maxHeight = 'none';
                    iframe.style.borderRadius = '0';
                    iframe.style.boxShadow = 'none';
                    isFullscreen = true;
                }catch(e){
                    console.warn('Fullscreen request failed', e);
                }
                return;
            }

            // Fallback: try on iframe itself
            if(iframe.requestFullscreen){
                try{
                    // save styles and then request
                    await iframe.requestFullscreen();
                    iframe.style.width = '100%';
                    iframe.style.height = '100%';
                    iframe.style.maxWidth = 'none';
                    iframe.style.maxHeight = 'none';
                    iframe.style.borderRadius = '0';
                    iframe.style.boxShadow = 'none';
                    isFullscreen = true;
                }catch(e){
                    console.warn('Fullscreen request failed', e);
                }
            }
        });

        // Fullscreen change handler to restore styles when exiting
        document.addEventListener('fullscreenchange', function(){
            const docEl = document.fullscreenElement;
            if(docEl){
                // entered fullscreen
                isFullscreen = true;
            } else {
                // exited fullscreen; find if we had a target
                isFullscreen = false;
                const target = iframe.parentElement || iframe;
                // remove fullscreen class
                target.classList.remove('is-fullscreen');
                // restore inline styles
                restoreInlineStyles(iframe);
                restoreInlineStyles(target);
                // remove helper class after a tick
                setTimeout(()=> target.classList.remove('embed-fullscreen-target'), 50);
            }
        });
    }

    function init(){
        const iframe = document.querySelector('iframe');
        if(!iframe) return;

        // Create and style button
        const btn = createButton();
        // Append to body so it floats; position near top-right of iframe
        document.body.appendChild(btn);

        // Position observer to keep button aligned with iframe
        function updatePosition(){
            const rect = iframe.getBoundingClientRect();
            const btnWidth = 40; // should match CSS
            const spacing = 12; // space between iframe and button

            // prefer to place button centered below the iframe
            let left = rect.left + (rect.width / 2) - (btnWidth / 2);
            // clamp within viewport
            left = Math.max(8, Math.min(left, window.innerWidth - btnWidth - 8));

            // calculate top as below the iframe
            let top = rect.bottom + spacing;
            // if not enough space below (offscreen), place above the iframe instead
            if(top + btnWidth + 8 > window.innerHeight){
                top = rect.top - spacing - btnWidth;
            }

            // fallback clamp for top
            top = Math.max(8, Math.min(top, window.innerHeight - btnWidth - 8));

            btn.style.position = 'fixed';
            btn.style.left = left + 'px';
            btn.style.top = top + 'px';
        }

        updatePosition();
        window.addEventListener('resize', updatePosition);
        window.addEventListener('scroll', updatePosition, {passive:true});

        enableFullscreen(iframe, btn);
    }

    // Run on DOM ready
    if(document.readyState === 'loading'){
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
