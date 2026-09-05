// Static-text localization for BirthdayBot. Only user-facing static copy lives here —
// dynamic/group-facing content (names, dates, the birthday greeting itself) stays in
// index.ts and is intentionally left in English so it reads the same for every member.

export const LANGS = ["en", "ru", "es", "pt", "id", "de", "tr", "uk", "fa", "ar", "hi"] as const;
export type Lang = (typeof LANGS)[number];
export type Key =
  | "help"
  | "start"
  | "addPrivateNudge"
  | "limitReached"
  | "greetingProOnly"
  | "gtzAdminOnly"
  | "proGroupInfo"
  | "proRunInGroup"
  | "proDescription"
  | "thankYou"
  | "btn_addToGroup"
  | "btn_shareBot"
  | "btn_unlockProStars"
  | "guestDaysUntil"
  | "app_title"
  | "app_loading"
  | "app_moreApps"
  | "app_empty"
  | "app_shareChat"
  | "app_shareStory"
  | "app_storyText"
  | "app_shareFail"
  | "app_errNoInit"
  | "app_errExpired"
  | "app_errBadSig"
  | "app_unlockPro"
  | "app_proOneTime"
  | "app_proMonthly"
  | "app_payDone"
  | "app_payCancelled"
  | "app_payFailed"
  | "app_group";

/** ctx.from.language_code -> first two letters -> known table language, else "en". */
export function resolveLang(code?: string): Lang {
  const c = (code ?? "").slice(0, 2).toLowerCase();
  return (LANGS as readonly string[]).includes(c) ? (c as Lang) : "en";
}

/** Look up `key` for `lang` (falling back to English), substituting `{name}` tokens from `vars`. */
export function t(lang: string, key: Key, vars?: Record<string, string | number>): string {
  const l: Lang = (LANGS as readonly string[]).includes(lang) ? (lang as Lang) : "en";
  let s = TABLE[key][l] ?? TABLE[key].en;
  if (vars) for (const [k, v] of Object.entries(vars)) s = s.replaceAll(`{${k}}`, String(v));
  return s;
}

const TABLE: Record<Key, Record<Lang, string>> = {
  help: {
    en: "🎂 *BirthdayBot* remembers group birthdays.\n\nAdd me to a group, then:\n`/bday 14-03` or `/bday 14-03-1990` — save your birthday\n`/upcoming` — next 10 birthdays and days left\n`/gtz +2` — set the group's timezone\n`/greeting Happy bday {name}! 🎉` — custom greeting (Pro)\n\nAt 9am local time I post 🎂 in the group on the day.\n\nFree: {free} birthdays per group. Pro: unlimited + custom greeting + a day-before DM, one-time {stars} ⭐ per group — /pro",
    ru: "🎂 *BirthdayBot* помнит дни рождения в группе.\n\nДобавьте меня в группу, затем:\n`/bday 14-03` или `/bday 14-03-1990` — сохранить свой день рождения\n`/upcoming` — ближайшие 10 дней рождения и сколько дней осталось\n`/gtz +2` — часовой пояс группы\n`/greeting С днём рождения, {name}! 🎉` — своё поздравление (Pro)\n\nВ 9 утра по местному времени я публикую 🎂 в группе.\n\nБесплатно: {free} дней рождения на группу. Pro: без ограничений + своё поздравление + напоминание за день, разово {stars} ⭐ за группу — /pro",
    es: "🎂 *BirthdayBot* recuerda los cumpleaños del grupo.\n\nAgrégame a un grupo, luego:\n`/bday 14-03` o `/bday 14-03-1990` — guarda tu cumpleaños\n`/upcoming` — próximos 10 cumpleaños y días restantes\n`/gtz +2` — zona horaria del grupo\n`/greeting ¡Feliz cumple {name}! 🎉` — mensaje personalizado (Pro)\n\nA las 9am hora local publico 🎂 en el grupo.\n\nGratis: {free} cumpleaños por grupo. Pro: ilimitado + mensaje personalizado + aviso el día antes, pago único de {stars} ⭐ por grupo — /pro",
    pt: "🎂 *BirthdayBot* lembra os aniversários do grupo.\n\nAdicione-me a um grupo, depois:\n`/bday 14-03` ou `/bday 14-03-1990` — salve seu aniversário\n`/upcoming` — próximos 10 aniversários e dias restantes\n`/gtz +2` — fuso horário do grupo\n`/greeting Feliz aniversário {name}! 🎉` — mensagem personalizada (Pro)\n\nÀs 9h local eu posto 🎂 no grupo.\n\nGrátis: {free} aniversários por grupo. Pro: ilimitado + mensagem personalizada + aviso um dia antes, pagamento único de {stars} ⭐ por grupo — /pro",
    id: "🎂 *BirthdayBot* mengingat ulang tahun grup.\n\nTambahkan aku ke grup, lalu:\n`/bday 14-03` atau `/bday 14-03-1990` — simpan ulang tahunmu\n`/upcoming` — 10 ulang tahun berikutnya dan sisa harinya\n`/gtz +2` — zona waktu grup\n`/greeting Selamat ulang tahun {name}! 🎉` — ucapan kustom (Pro)\n\nJam 9 pagi waktu lokal aku posting 🎂 di grup.\n\nGratis: {free} ulang tahun per grup. Pro: tanpa batas + ucapan kustom + DM sehari sebelumnya, sekali bayar {stars} ⭐ per grup — /pro",
    de: "🎂 *BirthdayBot* merkt sich Geburtstage der Gruppe.\n\nFüge mich zu einer Gruppe hinzu, dann:\n`/bday 14-03` oder `/bday 14-03-1990` — speichere deinen Geburtstag\n`/upcoming` — die nächsten 10 Geburtstage und verbleibende Tage\n`/gtz +2` — Zeitzone der Gruppe\n`/greeting Alles Gute {name}! 🎉` — eigener Gruß (Pro)\n\nUm 9 Uhr Ortszeit poste ich 🎂 in der Gruppe.\n\nKostenlos: {free} Geburtstage pro Gruppe. Pro: unbegrenzt + eigener Gruß + Erinnerung am Vortag, einmalig {stars} ⭐ pro Gruppe — /pro",
    tr: "🎂 *BirthdayBot* grubun doğum günlerini hatırlar.\n\nBeni bir gruba ekle, sonra:\n`/bday 14-03` veya `/bday 14-03-1990` — doğum gününü kaydet\n`/upcoming` — sıradaki 10 doğum günü ve kalan gün\n`/gtz +2` — grubun saat dilimi\n`/greeting İyi ki doğdun {name}! 🎉` — özel kutlama (Pro)\n\nYerel saatle 09:00'da grupta 🎂 paylaşırım.\n\nÜcretsiz: grup başına {free} doğum günü. Pro: sınırsız + özel kutlama + bir gün önceden DM, grup başına tek seferlik {stars} ⭐ — /pro",
    uk: "🎂 *BirthdayBot* пам'ятає дні народження групи.\n\nДодайте мене до групи, потім:\n`/bday 14-03` або `/bday 14-03-1990` — зберегти свій день народження\n`/upcoming` — найближчі 10 днів народження і скільки днів залишилось\n`/gtz +2` — часовий пояс групи\n`/greeting З днем народження, {name}! 🎉` — власне привітання (Pro)\n\nО 9 ранку за місцевим часом я публікую 🎂 в групі.\n\nБезкоштовно: {free} днів народження на групу. Pro: без обмежень + власне привітання + нагадування за день, разово {stars} ⭐ за групу — /pro",
    fa: "🎂 *BirthdayBot* تولدهای گروه را به‌خاطر می‌سپارد.\n\nمرا به یک گروه اضافه کنید، سپس:\n`/bday 14-03` یا `/bday 14-03-1990` — تولد خود را ذخیره کنید\n`/upcoming` — ۱۰ تولد بعدی و روزهای باقی‌مانده\n`/gtz +2` — منطقهٔ زمانی گروه\n`/greeting تولدت مبارک {name}! 🎉` — پیام سفارشی (Pro)\n\nساعت ۹ صبح به وقت محلی 🎂 را در گروه ارسال می‌کنم.\n\nرایگان: {free} تولد در هر گروه. Pro: نامحدود + پیام سفارشی + یادآوری یک روز قبل، پرداخت یک‌باره {stars} ⭐ برای هر گروه — /pro",
    ar: "🎂 *BirthdayBot* يتذكّر أعياد ميلاد المجموعة.\n\nأضفني إلى مجموعة، ثم:\n`/bday 14-03` أو `/bday 14-03-1990` — احفظ عيد ميلادك\n`/upcoming` — أقرب 10 أعياد ميلاد وعدد الأيام المتبقية\n`/gtz +2` — المنطقة الزمنية للمجموعة\n`/greeting عيد ميلاد سعيد {name}! 🎉` — تهنئة مخصصة (Pro)\n\nالساعة 9 صباحًا بالتوقيت المحلي أنشر 🎂 في المجموعة.\n\nمجانًا: {free} أعياد ميلاد لكل مجموعة. Pro: غير محدود + تهنئة مخصصة + تذكير قبل يوم، دفعة واحدة {stars} ⭐ لكل مجموعة — /pro",
    hi: "🎂 *BirthdayBot* ग्रुप के जन्मदिन याद रखता है।\n\nमुझे किसी ग्रुप में जोड़ें, फिर:\n`/bday 14-03` या `/bday 14-03-1990` — अपना जन्मदिन सेव करें\n`/upcoming` — अगले 10 जन्मदिन और बचे दिन\n`/gtz +2` — ग्रुप का टाइमज़ोन\n`/greeting जन्मदिन मुबारक हो {name}! 🎉` — कस्टम बधाई (Pro)\n\nस्थानीय समय सुबह 9 बजे मैं ग्रुप में 🎂 पोस्ट करता हूं।\n\nमुफ़्त: प्रति ग्रुप {free} जन्मदिन। Pro: असीमित + कस्टम बधाई + एक दिन पहले DM, प्रति ग्रुप एकमुश्त {stars} ⭐ — /pro",
  },
  start: {
    en: "🎂 Nobody in your group forgets a birthday again.\nAdd me, then everyone sends `/bday 14-03` once.\nAt 9am on the day I post 🎂 in the group.\nFree: {free} birthdays per group · /help",
    ru: "🎂 Никто в вашей группе больше не забудет день рождения.\nДобавьте меня, и пусть все один раз пришлют `/bday 14-03`.\nВ 9 утра в этот день я опубликую 🎂 в группе.\nБесплатно: {free} дней рождения на группу · /help",
    es: "🎂 Nadie en tu grupo volverá a olvidar un cumpleaños.\nAgrégame, luego que todos envíen `/bday 14-03` una vez.\nA las 9am del día publico 🎂 en el grupo.\nGratis: {free} cumpleaños por grupo · /help",
    pt: "🎂 Ninguém no seu grupo esquece um aniversário de novo.\nAdicione-me, depois cada um envia `/bday 14-03` uma vez.\nÀs 9h do dia eu posto 🎂 no grupo.\nGrátis: {free} aniversários por grupo · /help",
    id: "🎂 Tidak ada lagi yang lupa ulang tahun di grupmu.\nTambahkan aku, lalu semua kirim `/bday 14-03` sekali.\nJam 9 pagi di hari itu aku posting 🎂 di grup.\nGratis: {free} ulang tahun per grup · /help",
    de: "🎂 Niemand in deiner Gruppe vergisst je wieder einen Geburtstag.\nFüge mich hinzu, dann sendet jeder einmal `/bday 14-03`.\nUm 9 Uhr am Tag poste ich 🎂 in der Gruppe.\nKostenlos: {free} Geburtstage pro Gruppe · /help",
    tr: "🎂 Grubunda artık kimse doğum gününü unutmaz.\nBeni ekle, sonra herkes bir kez `/bday 14-03` göndersin.\nO gün saat 09:00'da grupta 🎂 paylaşırım.\nÜcretsiz: grup başına {free} doğum günü · /help",
    uk: "🎂 Ніхто у вашій групі більше не забуде день народження.\nДодайте мене, і нехай кожен один раз надішле `/bday 14-03`.\nО 9 ранку того дня я опублікую 🎂 в групі.\nБезкоштовно: {free} днів народження на групу · /help",
    fa: "🎂 دیگر هیچ‌کس در گروه شما تولدی را فراموش نمی‌کند.\nمرا اضافه کنید، سپس هرکس یک‌بار `/bday 14-03` را بفرستد.\nساعت ۹ صبح همان روز 🎂 را در گروه منتشر می‌کنم.\nرایگان: {free} تولد در هر گروه · /help",
    ar: "🎂 لن ينسى أحد في مجموعتك عيد ميلاد بعد الآن.\nأضفني، ثم ليرسل كل عضو `/bday 14-03` مرة واحدة.\nالساعة 9 صباحًا من ذلك اليوم أنشر 🎂 في المجموعة.\nمجانًا: {free} أعياد ميلاد لكل مجموعة · /help",
    hi: "🎂 अब आपके ग्रुप में कोई जन्मदिन नहीं भूलेगा।\nमुझे जोड़ें, फिर हर कोई एक बार `/bday 14-03` भेजे।\nउस दिन सुबह 9 बजे मैं ग्रुप में 🎂 पोस्ट करता हूं।\nमुफ़्त: प्रति ग्रुप {free} जन्मदिन · /help",
  },
  addPrivateNudge: {
    en: "Add me to a group first, then use this there.",
    ru: "Сначала добавьте меня в группу, затем используйте это там.",
    es: "Agrégame a un grupo primero, luego usa esto ahí.",
    pt: "Adicione-me a um grupo primeiro, depois use isso lá.",
    id: "Tambahkan aku ke grup dulu, lalu gunakan ini di sana.",
    de: "Füge mich zuerst zu einer Gruppe hinzu, dann nutze das dort.",
    tr: "Önce beni bir gruba ekle, sonra orada bunu kullan.",
    uk: "Спочатку додайте мене до групи, потім використовуйте це там.",
    fa: "ابتدا مرا به یک گروه اضافه کنید، سپس آن را آنجا استفاده کنید.",
    ar: "أضفني إلى مجموعة أولًا، ثم استخدم هذا هناك.",
    hi: "पहले मुझे किसी ग्रुप में जोड़ें, फिर इसे वहां इस्तेमाल करें।",
  },
  limitReached: {
    en: "This group reached the free limit of {free} birthdays. Pro is unlimited (one-time {stars} ⭐).",
    ru: "Эта группа достигла бесплатного лимита в {free} дней рождения. Pro без ограничений (разово {stars} ⭐).",
    es: "Este grupo alcanzó el límite gratuito de {free} cumpleaños. Pro es ilimitado (pago único de {stars} ⭐).",
    pt: "Este grupo atingiu o limite grátis de {free} aniversários. Pro é ilimitado (pagamento único de {stars} ⭐).",
    id: "Grup ini mencapai batas gratis {free} ulang tahun. Pro tanpa batas (sekali bayar {stars} ⭐).",
    de: "Diese Gruppe hat das kostenlose Limit von {free} Geburtstagen erreicht. Pro ist unbegrenzt (einmalig {stars} ⭐).",
    tr: "Bu grup ücretsiz {free} doğum günü sınırına ulaştı. Pro sınırsızdır (tek seferlik {stars} ⭐).",
    uk: "Ця група досягла безкоштовного ліміту {free} днів народження. Pro без обмежень (разово {stars} ⭐).",
    fa: "این گروه به محدودیت رایگان {free} تولد رسیده است. Pro نامحدود است (پرداخت یک‌باره {stars} ⭐).",
    ar: "وصلت هذه المجموعة إلى الحد المجاني وهو {free} عيد ميلاد. Pro غير محدود (دفعة واحدة {stars} ⭐).",
    hi: "इस ग्रुप ने मुफ़्त सीमा {free} जन्मदिन पूरी कर ली है। Pro असीमित है (एकमुश्त {stars} ⭐)।",
  },
  greetingProOnly: {
    en: "A custom greeting is a Pro feature for this group.",
    ru: "Своё поздравление — функция Pro для этой группы.",
    es: "Un mensaje personalizado es una función Pro para este grupo.",
    pt: "Uma mensagem personalizada é um recurso Pro para este grupo.",
    id: "Ucapan kustom adalah fitur Pro untuk grup ini.",
    de: "Ein eigener Gruß ist eine Pro-Funktion für diese Gruppe.",
    tr: "Özel kutlama bu grup için bir Pro özelliğidir.",
    uk: "Власне привітання — функція Pro для цієї групи.",
    fa: "پیام سفارشی یک ویژگی Pro برای این گروه است.",
    ar: "التهنئة المخصصة ميزة Pro لهذه المجموعة.",
    hi: "कस्टम बधाई इस ग्रुप के लिए Pro सुविधा है।",
  },
  gtzAdminOnly: {
    en: "This group's timezone is already set. Only an admin can change it.",
    ru: "Часовой пояс этой группы уже установлен. Изменить может только администратор.",
    es: "La zona horaria de este grupo ya está configurada. Solo un admin puede cambiarla.",
    pt: "O fuso horário deste grupo já está definido. Só um admin pode alterá-lo.",
    id: "Zona waktu grup ini sudah diatur. Hanya admin yang bisa mengubahnya.",
    de: "Die Zeitzone dieser Gruppe ist bereits eingestellt. Nur ein Admin kann sie ändern.",
    tr: "Bu grubun saat dilimi zaten ayarlı. Yalnızca bir yönetici değiştirebilir.",
    uk: "Часовий пояс цієї групи вже встановлено. Змінити може лише адміністратор.",
    fa: "منطقهٔ زمانی این گروه از قبل تنظیم شده است. فقط یک ادمین می‌تواند آن را تغییر دهد.",
    ar: "تم ضبط المنطقة الزمنية لهذه المجموعة بالفعل. يمكن للمشرف فقط تغييرها.",
    hi: "इस ग्रुप का टाइमज़ोन पहले से सेट है। इसे केवल एक एडमिन बदल सकता है।",
  },
  proGroupInfo: {
    en: "Pro for this group: unlimited birthdays + custom greeting + day-before DM, one-time {stars} ⭐.",
    ru: "Pro для этой группы: неограниченные дни рождения + своё поздравление + напоминание за день, разово {stars} ⭐.",
    es: "Pro para este grupo: cumpleaños ilimitados + mensaje personalizado + aviso el día antes, pago único de {stars} ⭐.",
    pt: "Pro para este grupo: aniversários ilimitados + mensagem personalizada + aviso um dia antes, pagamento único de {stars} ⭐.",
    id: "Pro untuk grup ini: ulang tahun tanpa batas + ucapan kustom + DM sehari sebelumnya, sekali bayar {stars} ⭐.",
    de: "Pro für diese Gruppe: unbegrenzte Geburtstage + eigener Gruß + Erinnerung am Vortag, einmalig {stars} ⭐.",
    tr: "Bu grup için Pro: sınırsız doğum günü + özel kutlama + bir gün önceden DM, tek seferlik {stars} ⭐.",
    uk: "Pro для цієї групи: необмежені дні народження + власне привітання + нагадування за день, разово {stars} ⭐.",
    fa: "Pro برای این گروه: تولدهای نامحدود + پیام سفارشی + یادآوری یک روز قبل، پرداخت یک‌باره {stars} ⭐.",
    ar: "Pro لهذه المجموعة: أعياد ميلاد غير محدودة + تهنئة مخصصة + تذكير قبل يوم، دفعة واحدة {stars} ⭐.",
    hi: "इस ग्रुप के लिए Pro: असीमित जन्मदिन + कस्टम बधाई + एक दिन पहले DM, एकमुश्त {stars} ⭐।",
  },
  proRunInGroup: {
    en: "Run /pro inside the group you want to upgrade.",
    ru: "Запустите /pro внутри группы, которую хотите обновить.",
    es: "Ejecuta /pro dentro del grupo que quieres mejorar.",
    pt: "Execute /pro dentro do grupo que deseja atualizar.",
    id: "Jalankan /pro di dalam grup yang ingin kamu tingkatkan.",
    de: "Führe /pro in der Gruppe aus, die du upgraden möchtest.",
    tr: "Yükseltmek istediğin grubun içinde /pro çalıştır.",
    uk: "Запустіть /pro всередині групи, яку хочете оновити.",
    fa: "دستور /pro را داخل گروهی که می‌خواهید ارتقا دهید اجرا کنید.",
    ar: "شغّل /pro داخل المجموعة التي تريد ترقيتها.",
    hi: "जिस ग्रुप को अपग्रेड करना है, उसके अंदर /pro चलाएं।",
  },
  proDescription: {
    en: "Unlimited birthdays, custom greeting and a day-before DM for one group. One-time payment, no subscription.",
    ru: "Неограниченные дни рождения, своё поздравление и напоминание за день для одной группы. Разовый платёж, без подписки.",
    es: "Cumpleaños ilimitados, mensaje personalizado y aviso el día antes para un grupo. Pago único, sin suscripción.",
    pt: "Aniversários ilimitados, mensagem personalizada e aviso um dia antes para um grupo. Pagamento único, sem assinatura.",
    id: "Ulang tahun tanpa batas, ucapan kustom, dan DM sehari sebelumnya untuk satu grup. Sekali bayar, tanpa langganan.",
    de: "Unbegrenzte Geburtstage, eigener Gruß und Erinnerung am Vortag für eine Gruppe. Einmalzahlung, kein Abo.",
    tr: "Bir grup için sınırsız doğum günü, özel kutlama ve bir gün önceden DM. Tek seferlik ödeme, abonelik yok.",
    uk: "Необмежені дні народження, власне привітання та нагадування за день для однієї групи. Разовий платіж, без підписки.",
    fa: "تولدهای نامحدود، پیام سفارشی و یادآوری یک روز قبل برای یک گروه. پرداخت یک‌باره، بدون اشتراک.",
    ar: "أعياد ميلاد غير محدودة وتهنئة مخصصة وتذكير قبل يوم لمجموعة واحدة. دفعة واحدة، بدون اشتراك.",
    hi: "एक ग्रुप के लिए असीमित जन्मदिन, कस्टम बधाई और एक दिन पहले DM। एकमुश्त भुगतान, कोई सब्सक्रिप्शन नहीं।",
  },
  thankYou: {
    en: "✅ Pro unlocked for the group. Unlimited birthdays, custom greeting and day-before DMs.\n\n/more — more free tools",
    ru: "✅ Pro активирован для группы. Неограниченные дни рождения, своё поздравление и напоминания за день.\n\n/more — другие бесплатные инструменты",
    es: "✅ Pro activado para el grupo. Cumpleaños ilimitados, mensaje personalizado y avisos el día antes.\n\n/more — más herramientas gratis",
    pt: "✅ Pro ativado para o grupo. Aniversários ilimitados, mensagem personalizada e avisos um dia antes.\n\n/more — mais ferramentas grátis",
    id: "✅ Pro aktif untuk grup. Ulang tahun tanpa batas, ucapan kustom, dan DM sehari sebelumnya.\n\n/more — alat gratis lainnya",
    de: "✅ Pro für die Gruppe freigeschaltet. Unbegrenzte Geburtstage, eigener Gruß und Erinnerungen am Vortag.\n\n/more — weitere kostenlose Tools",
    tr: "✅ Grup için Pro açıldı. Sınırsız doğum günü, özel kutlama ve bir gün önceden hatırlatmalar.\n\n/more — daha fazla ücretsiz araç",
    uk: "✅ Pro активовано для групи. Необмежені дні народження, власне привітання та нагадування за день.\n\n/more — інші безкоштовні інструменти",
    fa: "✅ Pro برای گروه فعال شد. تولدهای نامحدود، پیام سفارشی و یادآوری یک روز قبل.\n\n/more — ابزارهای رایگان بیشتر",
    ar: "✅ تم تفعيل Pro للمجموعة. أعياد ميلاد غير محدودة وتهنئة مخصصة وتذكيرات قبل يوم.\n\n/more — أدوات مجانية أخرى",
    hi: "✅ ग्रुप के लिए Pro अनलॉक हुआ। असीमित जन्मदिन, कस्टम बधाई और एक दिन पहले DM।\n\n/more — और मुफ़्त टूल्स",
  },
  btn_addToGroup: {
    en: "Add me to a group", ru: "Добавить в группу", es: "Añadirme a un grupo",
    pt: "Adicionar a um grupo", id: "Tambahkan ke grup", de: "Zu Gruppe hinzufügen",
    tr: "Gruba ekle", uk: "Додати до групи", fa: "افزودن به گروه",
    ar: "أضفني إلى مجموعة", hi: "ग्रुप में जोड़ें",
  },
  btn_shareBot: {
    en: "📣 Share this bot", ru: "📣 Поделиться ботом", es: "📣 Compartir este bot",
    pt: "📣 Compartilhar este bot", id: "📣 Bagikan bot ini", de: "📣 Bot teilen",
    tr: "📣 Botu paylaş", uk: "📣 Поділитися ботом", fa: "📣 اشتراک‌گذاری ربات",
    ar: "📣 شارك هذا البوت", hi: "📣 यह बॉट शेयर करें",
  },
  btn_unlockProStars: {
    en: "Unlock Pro, {stars} ⭐", ru: "Купить Pro, {stars} ⭐", es: "Desbloquear Pro, {stars} ⭐",
    pt: "Desbloquear Pro, {stars} ⭐", id: "Buka Pro, {stars} ⭐", de: "Pro freischalten, {stars} ⭐",
    tr: "Pro'yu aç, {stars} ⭐", uk: "Купити Pro, {stars} ⭐", fa: "باز کردن Pro، {stars} ⭐",
    ar: "فتح Pro، {stars} ⭐", hi: "Pro अनलॉक करें, {stars} ⭐",
  },
  guestDaysUntil: {
    en: "🎂 {when} is {days} away.\n\nAdd me to a group with /bday {when} — I'll remind and greet automatically.",
    ru: "🎂 До {when} осталось {days}.\n\nДобавьте меня в группу командой /bday {when} — я сам напомню и поздравлю.",
    es: "🎂 Faltan {days} para {when}.\n\nAgrégame a un grupo con /bday {when} — recordaré y felicitaré automáticamente.",
    pt: "🎂 Faltam {days} para {when}.\n\nAdicione-me a um grupo com /bday {when} — eu lembro e parabenizo automaticamente.",
    id: "🎂 {when} tinggal {days} lagi.\n\nTambahkan aku ke grup dengan /bday {when} — aku akan mengingatkan dan mengucapkan otomatis.",
    de: "🎂 Bis {when} sind es noch {days}.\n\nFüge mich mit /bday {when} zu einer Gruppe hinzu — ich erinnere und gratuliere automatisch.",
    tr: "🎂 {when} tarihine {days} kaldı.\n\nBeni /bday {when} ile bir gruba ekle — otomatik hatırlatır ve kutlarım.",
    uk: "🎂 До {when} лишилося {days}.\n\nДодайте мене до групи командою /bday {when} — я нагадаю і привітаю автоматично.",
    fa: "🎂 تا {when}، {days} باقی مانده است.\n\nمرا با /bday {when} به یک گروه اضافه کنید — به‌طور خودکار یادآوری و تبریک می‌گویم.",
    ar: "🎂 يتبقى {days} حتى {when}.\n\nأضفني إلى مجموعة عبر /bday {when} — سأذكّر وأهنّئ تلقائيًا.",
    hi: "🎂 {when} में {days} बाकी हैं।\n\nमुझे /bday {when} से किसी ग्रुप में जोड़ें — मैं अपने आप याद दिलाऊंगा और बधाई दूंगा।",
  },
  app_title: {
    en: "Birthday Reminders",
    ru: "Напоминания о днях рождения",
    es: "Recordatorios de cumpleaños",
    pt: "Lembretes de aniversário",
    id: "Pengingat Ulang Tahun",
    de: "Geburtstagserinnerungen",
    tr: "Doğum Günü Hatırlatıcıları",
    uk: "Нагадування про дні народження",
    fa: "یادآوری تولدها",
    ar: "تذكيرات أعياد الميلاد",
    hi: "जन्मदिन रिमाइंडर",
  },
  app_loading: {
    en: "Loading…",
    ru: "Загрузка…",
    es: "Cargando…",
    pt: "Carregando…",
    id: "Memuat…",
    de: "Wird geladen…",
    tr: "Yükleniyor…",
    uk: "Завантаження…",
    fa: "در حال بارگذاری…",
    ar: "جارٍ التحميل…",
    hi: "लोड हो रहा है…",
  },
  app_moreApps: {
    en: "More apps",
    ru: "Другие приложения",
    es: "Más apps",
    pt: "Mais apps",
    id: "Aplikasi lain",
    de: "Mehr Apps",
    tr: "Diğer uygulamalar",
    uk: "Інші застосунки",
    fa: "برنامه‌های بیشتر",
    ar: "تطبيقات أخرى",
    hi: "और ऐप्स",
  },
  app_empty: {
    en: "No birthdays saved yet.",
    ru: "Дней рождения пока нет.",
    es: "Aún no hay cumpleaños guardados.",
    pt: "Ainda não há aniversários salvos.",
    id: "Belum ada ulang tahun tersimpan.",
    de: "Noch keine Geburtstage gespeichert.",
    tr: "Henüz kayıtlı doğum günü yok.",
    uk: "Днів народження ще немає.",
    fa: "هنوز تولدی ذخیره نشده است.",
    ar: "لا توجد أعياد ميلاد محفوظة بعد.",
    hi: "अभी तक कोई जन्मदिन सेव नहीं हुआ।",
  },
  app_shareChat: {
    en: "💬 Share to a chat",
    ru: "💬 Отправить в чат",
    es: "💬 Compartir en chat",
    pt: "💬 Enviar no chat",
    id: "💬 Bagikan ke chat",
    de: "💬 In Chat teilen",
    tr: "💬 Sohbette paylaş",
    uk: "💬 Надіслати в чат",
    fa: "💬 ارسال به گفتگو",
    ar: "💬 مشاركة في محادثة",
    hi: "💬 चैट में भेजें",
  },
  app_shareStory: {
    en: "📣 Share to story",
    ru: "📣 В историю",
    es: "📣 A tu historia",
    pt: "📣 Nos stories",
    id: "📣 Bagikan ke story",
    de: "📣 Als Story teilen",
    tr: "📣 Hikâyede paylaş",
    uk: "📣 В історію",
    fa: "📣 اشتراک در استوری",
    ar: "📣 مشاركة في قصة",
    hi: "📣 स्टोरी में साझा करें",
  },
  app_storyText: {
    en: "Never miss a group birthday again — reminders and greetings right in the chat.",
    ru: "Больше ни один день рождения в группе не останется незамеченным — напоминания и поздравления прямо в чате.",
    es: "No te pierdas otro cumpleaños del grupo — recordatorios y felicitaciones directo en el chat.",
    pt: "Nunca mais perca um aniversário do grupo — lembretes e felicitações direto no chat.",
    id: "Jangan lewatkan ulang tahun grup lagi — pengingat dan ucapan langsung di chat.",
    de: "Verpasse nie wieder einen Geburtstag in der Gruppe — Erinnerungen und Glückwünsche direkt im Chat.",
    tr: "Gruptaki bir doğum gününü bir daha kaçırma — hatırlatmalar ve kutlamalar doğrudan sohbette.",
    uk: "Більше жоден день народження в групі не залишиться непоміченим — нагадування та привітання прямо в чаті.",
    fa: "دیگر هیچ تولدی در گروه از دست نمی‌رود — یادآوری و تبریک درست داخل گفتگو.",
    ar: "لن تفوّت عيد ميلاد في مجموعتك بعد الآن — تذكيرات وتهانٍ مباشرة في المحادثة.",
    hi: "अब ग्रुप का कोई जन्मदिन नहीं छूटेगा — रिमाइंडर और बधाई सीधे चैट में।",
  },
  app_shareFail: {
    en: "Sharing is unavailable right now.",
    ru: "Поделиться сейчас не получилось.",
    es: "Ahora mismo no se puede compartir.",
    pt: "Não foi possível compartilhar agora.",
    id: "Berbagi sedang tidak tersedia.",
    de: "Teilen ist gerade nicht möglich.",
    tr: "Şu anda paylaşılamıyor.",
    uk: "Поділитися зараз не вдалося.",
    fa: "در حال حاضر اشتراک‌گذاری ممکن نیست.",
    ar: "المشاركة غير متاحة الآن.",
    hi: "अभी साझा नहीं किया जा सकता।",
  },
  app_errNoInit: {
    en: "Open this app from the bot — tap the menu button.",
    ru: "Откройте это приложение из бота — кнопка меню.",
    es: "Abre esta app desde el bot — toca el botón de menú.",
    pt: "Abra este app pelo bot — toque no botão de menu.",
    id: "Buka aplikasi ini dari bot — ketuk tombol menu.",
    de: "Öffne diese App über den Bot — tippe auf den Menü-Button.",
    tr: "Bu uygulamayı bottan aç — menü düğmesine dokun.",
    uk: "Відкрийте застосунок із бота — кнопка меню.",
    fa: "این برنامه را از داخل ربات باز کنید — دکمه منو.",
    ar: "افتح هذا التطبيق من البوت — زر القائمة.",
    hi: "यह ऐप बॉट से खोलें — मेनू बटन दबाएँ।",
  },
  app_errExpired: {
    en: "This session expired. Close and reopen the app.",
    ru: "Сессия истекла. Закройте и откройте приложение снова.",
    es: "La sesión caducó. Cierra y vuelve a abrir la app.",
    pt: "A sessão expirou. Feche e abra o app de novo.",
    id: "Sesi berakhir. Tutup lalu buka lagi aplikasinya.",
    de: "Sitzung abgelaufen. App schließen und neu öffnen.",
    tr: "Oturum doldu. Uygulamayı kapatıp yeniden aç.",
    uk: "Сесія завершилася. Закрийте й відкрийте застосунок.",
    fa: "نشست منقضی شد. برنامه را ببندید و دوباره باز کنید.",
    ar: "انتهت الجلسة. أغلق التطبيق ثم افتحه من جديد.",
    hi: "सेशन खत्म हो गया। ऐप बंद करके फिर खोलें।",
  },
  app_errBadSig: {
    en: "This link is not valid. Reopen the app from the bot.",
    ru: "Ссылка недействительна. Откройте приложение из бота.",
    es: "Este enlace no es válido. Abre la app desde el bot.",
    pt: "Este link não é válido. Abra o app pelo bot.",
    id: "Tautan ini tidak valid. Buka aplikasi dari bot.",
    de: "Dieser Link ist ungültig. Öffne die App über den Bot.",
    tr: "Bu bağlantı geçersiz. Uygulamayı bottan aç.",
    uk: "Посилання недійсне. Відкрийте застосунок із бота.",
    fa: "این پیوند معتبر نیست. برنامه را از ربات باز کنید.",
    ar: "هذا الرابط غير صالح. افتح التطبيق من البوت.",
    hi: "यह लिंक मान्य नहीं है। ऐप बॉट से खोलें।",
  },
  app_unlockPro: {
    en: "🔓 Unlock Pro",
    ru: "🔓 Открыть Pro",
    es: "🔓 Desbloquear Pro",
    pt: "🔓 Desbloquear Pro",
    id: "🔓 Buka Pro",
    de: "🔓 Pro freischalten",
    tr: "🔓 Pro'yu aç",
    uk: "🔓 Відкрити Pro",
    fa: "🔓 فعال‌سازی Pro",
    ar: "🔓 تفعيل Pro",
    hi: "🔓 Pro अनलॉक करें",
  },
  app_proOneTime: {
    en: "One-time {n} ⭐",
    ru: "Разово {n} ⭐",
    es: "Pago único {n} ⭐",
    pt: "Único {n} ⭐",
    id: "Sekali bayar {n} ⭐",
    de: "Einmalig {n} ⭐",
    tr: "Tek seferlik {n} ⭐",
    uk: "Разово {n} ⭐",
    fa: "یک‌باره {n} ⭐",
    ar: "مرة واحدة {n} ⭐",
    hi: "एकमुश्त {n} ⭐",
  },
  app_proMonthly: {
    en: "Monthly {n} ⭐/mo",
    ru: "Ежемесячно {n} ⭐",
    es: "Mensual {n} ⭐/mes",
    pt: "Mensal {n} ⭐/mês",
    id: "Bulanan {n} ⭐/bln",
    de: "Monatlich {n} ⭐",
    tr: "Aylık {n} ⭐/ay",
    uk: "Щомісяця {n} ⭐",
    fa: "ماهانه {n} ⭐",
    ar: "شهريًا {n} ⭐",
    hi: "मासिक {n} ⭐",
  },
  app_payDone: {
    en: "✅ Pro unlocked. Thank you.",
    ru: "✅ Pro активирован. Спасибо.",
    es: "✅ Pro activado. Gracias.",
    pt: "✅ Pro ativado. Obrigado.",
    id: "✅ Pro aktif. Terima kasih.",
    de: "✅ Pro aktiviert. Danke.",
    tr: "✅ Pro açıldı. Teşekkürler.",
    uk: "✅ Pro активовано. Дякуємо.",
    fa: "✅ Pro فعال شد. سپاسگزاریم.",
    ar: "✅ تم تفعيل Pro. شكرًا لك.",
    hi: "✅ Pro चालू हो गया। धन्यवाद।",
  },
  app_payCancelled: {
    en: "Payment cancelled.",
    ru: "Оплата отменена.",
    es: "Pago cancelado.",
    pt: "Pagamento cancelado.",
    id: "Pembayaran dibatalkan.",
    de: "Zahlung abgebrochen.",
    tr: "Ödeme iptal edildi.",
    uk: "Оплату скасовано.",
    fa: "پرداخت لغو شد.",
    ar: "أُلغيت عملية الدفع.",
    hi: "भुगतान रद्द हुआ।",
  },
  app_payFailed: {
    en: "Payment failed. Please try again.",
    ru: "Оплата не прошла. Попробуйте ещё раз.",
    es: "El pago falló. Inténtalo de nuevo.",
    pt: "O pagamento falhou. Tente de novo.",
    id: "Pembayaran gagal. Coba lagi.",
    de: "Zahlung fehlgeschlagen. Bitte erneut versuchen.",
    tr: "Ödeme başarısız. Tekrar dene.",
    uk: "Оплата не пройшла. Спробуйте ще раз.",
    fa: "پرداخت ناموفق بود. دوباره تلاش کنید.",
    ar: "فشل الدفع. حاول مرة أخرى.",
    hi: "भुगतान विफल। फिर कोशिश करें।",
  },
  app_group: {
    en: "Group",
    ru: "Группа",
    es: "Grupo",
    pt: "Grupo",
    id: "Grup",
    de: "Gruppe",
    tr: "Grup",
    uk: "Група",
    fa: "گروه",
    ar: "مجموعة",
    hi: "ग्रुप",
  },
};

/** The 11 language codes this bot ships, in table order. */
export const APP_LANGS: Lang[] = [...LANGS];

/** Every `app_*` key, for every language, as a plain object -- the Mini App's embedded
 * `APP_I18N` dictionary. English fills any gap so a client lookup can never miss.
 * Both loops are bounded by the static table (11 languages x the app_* key set). */
export function appDict(): Record<string, Record<string, string>> {
  const keys = (Object.keys(TABLE) as Key[]).filter((k) => k.startsWith("app_"));
  const out: Record<string, Record<string, string>> = {};
  for (const l of LANGS) {
    const m: Record<string, string> = {};
    for (const k of keys) m[k] = TABLE[k][l] ?? TABLE[k].en;
    out[l] = m;
  }
  return out;
}
