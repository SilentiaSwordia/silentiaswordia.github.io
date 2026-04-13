// Funksjon for å sjekke om systemet bruker mørkt eller lyst tema
const detectSystemTheme = () => {
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
};

// Lytt etter endringer i systemtemaet (f.eks. hvis brukeren bytter fra lyst til mørkt tema i OS)
window
  .matchMedia("(prefers-color-scheme: dark)")
  .addEventListener("change", (e) => {
    if (e.matches) {
      console.log("System switched to dark mode");
      // Her kan man legge til kode for å oppdatere applikasjonens tema dynamisk hvis nødvendig
    } else {
      console.log("System switched to light mode");
    }
  });

// Navigasjon fra login-knapp (hvis den finnes på siden)
const loginBtn = document.getElementById("loginBtn");
if (loginBtn) {
  loginBtn.addEventListener("click", () => {
    window.location.href = "timeplan.html";
  });
}

// Funksjonalitet for sidemenyen (når nettsiden er ferdig lastet)
document.addEventListener("DOMContentLoaded", () => {
    // Finner alle lenker i menyvinduet som har en nedtrekksmeny (dropdown)
    const dropdownToggles = document.querySelectorAll(".has-dropdown > a");
    
    // Legger til en klikk-hendelse for hver nedtrekksmeny
    dropdownToggles.forEach(toggle => {
        toggle.addEventListener("click", (e) => {
            e.preventDefault(); // Forhindrer at siden hopper til toppen på grunn av href="#"
            
            // Finner foreldreelementet (<li>) og bytter på 'dropdown-open' klassen 
            // for å vise eller skjule undermenyen
            const parentLi = toggle.parentElement;
            parentLi.classList.toggle("dropdown-open");
        });
    });

    // --- Logikk for Dashboard Widgets (Startsiden) ---
    const grid = document.querySelector('.dashboard-grid');
    
    // Sjekker om rutenettet (grid) finnes og om Sortable-biblioteket er lastet inn
    if (grid && window.Sortable) {
        
        // Håndtering av sletting (Event Delegation)
        // Lytter på hele rutenettet istedenfor hver enkelt knapp. 
        // Dette gjør at nye kort vi legger til oppdager klikk på "søppelbøtten" automatisk.
        grid.addEventListener('click', (e) => {
            if (e.target.closest('.delete-widget-btn')) {
                const card = e.target.closest('.dashboard-card');
                if (card) {
                    card.remove(); // Fjerner kortet fra nettsiden
                    saveWidgetConfig(); // Oppdaterer lagringen slik at det forblir slettet neste gang du laster siden
                }
            }
        });

        // Initialiserer SortableJS, som lar oss dra og slippe kort i rutenettet
        new Sortable(grid, {
            handle: '.sortable-handle', // Sier at man må dra oppe i overskriften for å flytte kortet
            animation: 150, // Lager en myk overgang mens andre kort flytter seg unna
            ghostClass: 'sortable-ghost', // Klassenavn for stylingen av kortet som blir holdt fast/flyttet
            onEnd: function () {
                // Kalles opp hver gang noen slipper et kort - dette lagrer den nye rekkefølgen
                saveWidgetConfig();
            }
        });

        // Laster inn den lagrede rekkefølgen på dashboardet hvis den finnes
        loadWidgetConfig();

        // Logikk for "Legg til kort"-knappen
        const addCardBtn = document.getElementById('addCardBtn');
        if (addCardBtn) {
            addCardBtn.addEventListener('click', () => {
                // Genererer en unik ID for å holde styr på dette spesifikke nye kortet
                const uniqueId = 'custom-widget-' + Date.now();
                
                // HTML-koden for et tomt, nytt generisk kort
                const cardHTML = `
                    <section class="dashboard-card" data-widget-id="${uniqueId}">
                        <header class="card-header sortable-handle">
                            <h2>Nytt kort</h2>
                            <button class="btn-icon delete-widget-btn"><i class="fa-solid fa-trash"></i></button>
                        </header>
                        <div class="card-body" style="padding: 24px; color: var(--text-secondary);">
                            <p>Dette er et generisk kort. Du kan legge til innhold her.</p>
                        </div>
                    </section>
                `;
                
                // Legger det nye kortet bakerst i rutenettet
                grid.insertAdjacentHTML('beforeend', cardHTML);
                // Lagrer den nye konfigurasjonen umiddelbart
                saveWidgetConfig();
            });
        }
    }

    // --- Logikk for Profile Dropdown (Top Navigation) ---
    const userProfile = document.querySelector('.user-profile');
    if (userProfile) {
        userProfile.addEventListener('click', (e) => {
            // Unngå at klikk inne i selve dropdown-lenkene også lukker den hvis de evt har prevetDefault
            // (men vi vil at lenkene inni skal fungere som normalt, så sjekker at vi ikke klikker på dropdown)
            if (!e.target.closest('.profile-dropdown')) {
                userProfile.classList.toggle('active');
            }
            e.stopPropagation();
        });

        // Lukk dropdown når man klikker hvor som helst utenfor
        document.addEventListener('click', (e) => {
            if (!userProfile.contains(e.target)) {
                userProfile.classList.remove('active');
            }
        });
    }
});

// Funksjon for å lagre rekkefølgen og innoldet av kortene midlertidig (i brukerens nettleser)
function saveWidgetConfig() {
    const grid = document.querySelector('.dashboard-grid');
    if (!grid) return;
    
    const config = [];
    
    // Går gjennom alle kortene som for øyeblikket er på skjermen i riktig rekkefølge
    grid.querySelectorAll('.dashboard-card').forEach(card => {
        const id = card.getAttribute('data-widget-id');
        let html = null;
        
        // Hvis kortet er et "fremmed" generisk kort, lagrer vi selvsagt innholdet (HTML) også.
        // For standardkortene (timeplan, min oversikt) lagres bare id'en for å spare plass.
        if (id && !id.includes('-default')) {
            html = card.outerHTML; 
        }
        
        config.push({ id, html });
    });
    
    // Gjør dette om til tekst og lagrer gjemt i nettleseren sin minne 'localStorage'
    localStorage.setItem('dashboard-config', JSON.stringify(config));
}

// Funksjon for å hente den lagrede layouten og bygge opp kortene slik brukeren forlot dem
function loadWidgetConfig() {
    const configStr = localStorage.getItem('dashboard-config');
    if (!configStr) return; // Hvis ingenting var lagret (første bedriftsbesøk), vis standardskjermen
    
    try {
        const config = JSON.parse(configStr);
        const grid = document.querySelector('.dashboard-grid');
        
        // Finner og midlertidig fjerner standard-kortene (slik som Timeplan)
        const defaultWidgets = {};
        grid.querySelectorAll('[data-widget-id$="-default"]').forEach(w => {
            defaultWidgets[w.getAttribute('data-widget-id')] = w;
            w.remove(); 
        });
        
        // Fjerner absolutt resten i rute-nettet for å sikre clean slate
        grid.innerHTML = ''; 
        
        // Løper gjennom den lagrede lista i rekkefølge og injiserer kortene på nytt
        config.forEach(item => {
            if (item.id && defaultWidgets[item.id]) {
                // Setter tilbake et standard kort
                grid.appendChild(defaultWidgets[item.id]);
            } else if (item.html) {
                // Setter inn et nytt unikt bruker-opprettet kort
                grid.insertAdjacentHTML('beforeend', item.html);
            }
        });
    } catch (e) {
        // Ignorer og vis en feil hvis no galt skjedde under prosessen 
        console.error("Error loading dashboard config:", e);
    }
}
