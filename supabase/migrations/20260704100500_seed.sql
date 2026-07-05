-- ═══════════════════════════════════════════════════════════════
-- AUTOSTORE — 06. Seed: real business data + editable content +
-- demo vehicles (is_demo=true, removable with one admin action).
-- Placeholders use the required "[INSERIRE ...]" format.
-- ═══════════════════════════════════════════════════════════════

-- ── business_information (real data from the brief) ────────────
insert into public.business_information (
  id, name, legal_name, vat_number, tax_code, rea, sdi, pec,
  address, city, zip, province, phone, whatsapp, email,
  hours, social, autoscout_dealer_url
) values (
  1,
  'Autostore',
  'AUTOSTORE S.R.L.',
  '03129320598',
  '03129320598',
  'LT-302800',
  'AGX0ABB',
  'autostoresrlaprilia@pec.it',
  'Via delle Palme angolo Via Ottaviano 8',
  'Aprilia',
  '04011',
  'LT',
  '[INSERIRE TELEFONO]',
  '[INSERIRE NUMERO WHATSAPP]',
  'info@autostoreaprilia.com',
  '[
    {"days": "Lunedì – Venerdì", "hours": "[INSERIRE ORARI]"},
    {"days": "Sabato", "hours": "[INSERIRE ORARI]"},
    {"days": "Domenica", "hours": "[INSERIRE ORARI]"}
  ]'::jsonb,
  '[
    {"platform": "instagram", "url": "", "enabled": false},
    {"platform": "facebook", "url": "", "enabled": false},
    {"platform": "tiktok", "url": "", "enabled": false},
    {"platform": "youtube", "url": "", "enabled": false}
  ]'::jsonb,
  null
);

-- ── autoscout_settings singleton (explicitly not configured) ───
insert into public.autoscout_settings (id, status) values (1, 'not_configured');

-- ── editable content sections ──────────────────────────────────
insert into public.content_sections (key, locale, value) values
(
  'hero', 'it',
  '{
    "headline": "Auto usate selezionate, ad Aprilia.",
    "subheadline": "Schede complete, foto reali e prezzi chiari per ogni vettura del parco. Vienile a vedere in sede o scrivici.",
    "cta_primary": "Scopri il parco auto",
    "cta_secondary": "Contattaci",
    "image_url": null
  }'::jsonb
),
(
  'why_us', 'it',
  '{
    "title": "Perché Autostore",
    "items": [
      {"title": "Schede trasparenti", "text": "Dati tecnici completi, dotazioni e foto reali per ogni auto in vendita."},
      {"title": "Valutazione del tuo usato", "text": "Portaci la tua auto: la valutiamo per permuta o acquisto diretto."},
      {"title": "[INSERIRE PUNTO DI FORZA]", "text": "[INSERIRE TESTO]"}
    ]
  }'::jsonb
),
(
  'services', 'it',
  '{
    "title": "I nostri servizi",
    "items": [
      {"title": "Vendita auto usate, km 0 e aziendali", "text": "Parco auto selezionato con disponibilità aggiornata in tempo reale."},
      {"title": "Permuta e ritiro dell''usato", "text": "Richiedi una valutazione online: bastano i dati dell''auto e qualche foto."},
      {"title": "[INSERIRE SERVIZIO]", "text": "[INSERIRE DESCRIZIONE]"}
    ]
  }'::jsonb
),
(
  'reviews', 'it',
  '{
    "title": "Dicono di noi",
    "note": "Sezione predisposta per recensioni Google reali. Le voci seguenti sono segnaposto DEMO.",
    "items": [
      {"author": "[DEMO] Cliente 1", "rating": 5, "text": "[DEMO] Testo recensione di esempio, da sostituire con recensioni Google reali."},
      {"author": "[DEMO] Cliente 2", "rating": 5, "text": "[DEMO] Testo recensione di esempio, da sostituire con recensioni Google reali."}
    ]
  }'::jsonb
),
(
  'featured_reels', 'it',
  '{"title": "Dai nostri social", "items": []}'::jsonb
);

-- ── demo vehicles (deletable in one action: delete where is_demo) ──
insert into public.vehicles (
  slug, make, model, version, condition, body_type, availability,
  price, previous_price, price_on_request, vat_deductible,
  year, registration_month, mileage, fuel_type, transmission,
  power_hp, power_kw, engine_displacement, exterior_color, interior_color,
  doors, seats, emission_class, drivetrain, previous_owners,
  description, location, cover_image_url, equipment,
  featured, published, showroom_enabled, is_demo, internal_notes
) values
(
  'volkswagen-golf-1-5-tsi-life-2021',
  'Volkswagen', 'Golf', '1.5 TSI Life', 'usato', 'berlina', 'disponibile',
  18900, 19900, false, false,
  2021, 6, 61000, 'benzina', 'manuale',
  130, 96, 1498, 'Grigio chiaro metallizzato', 'Tessuto nero',
  5, 5, 'Euro 6d', 'anteriore', 1,
  'Volkswagen Golf 8 1.5 TSI Life in ottime condizioni, unico proprietario. Tagliandi documentati e gomme in buono stato. Interni curati, ideale per chi cerca una compatta completa e affidabile.',
  'Aprilia (LT)', '/demo/volkswagen-golf-1-5-tsi-life-2021.webp',
  array['Apple CarPlay / Android Auto', 'Cruise control adattivo', 'Cerchi in lega 16"', 'Sensori di parcheggio anteriori e posteriori', 'Fari LED', 'Clima automatico bizona'],
  true, true, true, true,
  'Veicolo demo (is_demo=true) — eliminare prima del go-live.'
),
(
  'audi-a3-sportback-30-tdi-s-tronic-2022',
  'Audi', 'A3 Sportback', '30 TDI S tronic Business', 'usato', 'berlina', 'disponibile',
  24900, null, false, true,
  2022, 3, 45000, 'diesel', 'automatico',
  116, 85, 1968, 'Nero brillante', 'Similpelle nera',
  5, 5, 'Euro 6d', 'anteriore', 1,
  'Audi A3 Sportback 30 TDI con cambio S tronic, versione Business. IVA esposta e deducibile. Perfetta per lunghe percorrenze, consumi contenuti e dotazione completa.',
  'Aprilia (LT)', '/demo/audi-a3-sportback-30-tdi-s-tronic-2022.webp',
  array['Virtual Cockpit', 'Navigatore MMI', 'Cruise control adattivo', 'Cerchi in lega 17"', 'Fari Full LED', 'Portellone elettrico'],
  true, true, true, true,
  'Veicolo demo (is_demo=true) — eliminare prima del go-live.'
),
(
  'toyota-yaris-1-5-hybrid-trend-2023',
  'Toyota', 'Yaris', '1.5 Hybrid Trend', 'usato', 'citycar', 'disponibile',
  19400, null, false, false,
  2023, 9, 22000, 'hybrid', 'automatico',
  116, 85, 1490, 'Bianco perla', 'Tessuto grigio',
  5, 5, 'Euro 6d', 'anteriore', 1,
  'Toyota Yaris Hybrid di ultima generazione, chilometraggio contenuto. Consumi ridotti in città grazie al sistema full hybrid, cambio automatico e-CVT.',
  'Aprilia (LT)', '/demo/toyota-yaris-1-5-hybrid-trend-2023.webp',
  array['Retrocamera', 'Toyota Safety Sense', 'Apple CarPlay / Android Auto', 'Clima automatico', 'Cerchi in lega 16"', 'Keyless entry'],
  true, true, true, true,
  'Veicolo demo (is_demo=true) — eliminare prima del go-live.'
),
(
  'jeep-renegade-1-0-t3-limited-2020',
  'Jeep', 'Renegade', '1.0 T3 Limited', 'usato', 'suv', 'disponibile',
  15900, 16900, false, false,
  2020, 11, 74000, 'benzina', 'manuale',
  120, 88, 999, 'Blu Jetset', 'Tessuto nero',
  5, 5, 'Euro 6d', 'anteriore', 2,
  'Jeep Renegade 1.0 T3 Limited benzina. Posizione di guida rialzata, dotazione ricca e look inconfondibile. Prezzo aggiornato di recente.',
  'Aprilia (LT)', '/demo/jeep-renegade-1-0-t3-limited-2020.webp',
  array['Uconnect 8.4" con navigatore', 'Cerchi in lega 18"', 'Sensori di parcheggio', 'Cruise control', 'Fari LED', 'Barre al tetto'],
  false, true, true, true,
  'Veicolo demo (is_demo=true) — eliminare prima del go-live.'
),
(
  'fiat-500x-1-3-multijet-cross-2019',
  'Fiat', '500X', '1.3 MultiJet Cross', 'usato', 'crossover', 'riservato',
  13500, null, false, false,
  2019, 4, 89000, 'diesel', 'manuale',
  95, 70, 1248, 'Rosso passione', 'Tessuto nero/grigio',
  5, 5, 'Euro 6d-temp', 'anteriore', 1,
  'Fiat 500X Cross 1.3 MultiJet, diesel economico e affidabile. Attualmente riservata: contattaci per verificare la disponibilità o per proposte simili.',
  'Aprilia (LT)', '/demo/fiat-500x-1-3-multijet-cross-2019.webp',
  array['Schermo touch 7"', 'Cruise control', 'Sensori di parcheggio posteriori', 'Cerchi in lega 17"', 'Fendinebbia'],
  false, true, true, true,
  'Veicolo demo (is_demo=true) — eliminare prima del go-live.'
),
(
  'renault-clio-tce-90-gpl-zen-2021',
  'Renault', 'Clio', 'TCe 90 GPL Zen', 'usato', 'utilitaria', 'disponibile',
  12900, null, false, false,
  2021, 2, 58000, 'gpl', 'manuale',
  90, 66, 999, 'Grigio titanio', 'Tessuto nero',
  5, 5, 'Euro 6d', 'anteriore', 1,
  'Renault Clio TCe 90 con impianto GPL di serie: costi di gestione ridottissimi e nessuna limitazione ZTL nella maggior parte dei comuni. Ideale come prima auto.',
  'Aprilia (LT)', '/demo/renault-clio-tce-90-gpl-zen-2021.webp',
  array['Easy Link 7" con Apple CarPlay', 'Cruise control', 'Fari Full LED', 'Clima manuale', 'Limitatore di velocità'],
  false, true, true, true,
  'Veicolo demo (is_demo=true) — eliminare prima del go-live.'
);
