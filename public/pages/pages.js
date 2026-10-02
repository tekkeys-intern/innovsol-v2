(function(){var n=document.getElementById('nav');if(n){var k=function(){n.classList.add('sc')};k();addEventListener('scroll',k,{passive:true})}
var els=document.querySelectorAll('.reveal');var red=window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches;
if(!('IntersectionObserver' in window)||red){els.forEach(function(e){e.classList.add('in-view')});return}
var io=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){e.target.classList.add('in-view');io.unobserve(e.target)}})},{threshold:.12});els.forEach(function(e){io.observe(e)})})();
