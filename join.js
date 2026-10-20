(async () => {
  const planParams = new URLSearchParams(window.location.search);
  const validPlans = ['basic', 'plus', 'premium'];

  const incomingPlanRaw =
    (planParams.get('plan') || '').toLowerCase();

  const incomingPlan =
    validPlans.includes(incomingPlanRaw)
      ? incomingPlanRaw
      : null;

  const isEdit =
    planParams.get('edit') === '1';


  if (!isEdit && !incomingPlan) {
    window.location.href = 'pricing.html';
    return;
  }


  const form =
    document.getElementById('therapistBuilder');

  if (!form) return;


  const sb =
    window.mmSupabase;


  function loginRedirectUrl() {

    const next =
      window.location.pathname.split('/').pop() +
      window.location.search;

    return (
      'login.html?next=' +
      encodeURIComponent(next)
    );

  }


  if (!sb) {

    alert(
      'MassageMatch connection did not load. Please refresh and try again.'
    );

    return;

  }


  const {
    data: { user: signedInUser },
    error: authCheckError
  } =
    await sb.auth.getUser();


  if (authCheckError) {

    console.error(
      'Could not check MassageMatch login:',
      authCheckError
    );

  }


  if (!signedInUser) {

    window.location.replace(
      loginRedirectUrl()
    );

    return;

  }


  const steps =
    [...document.querySelectorAll('.build-step')];

  const dots =
    [...document.querySelectorAll('.step-track span')];

  const next =
    document.getElementById('nextStep');

  const back =
    document.getElementById('backStep');

  const selected =
    document.getElementById('selectedTreatments');

  const photoInput =
    document.getElementById('profilePhotos');

  const photoGallery =
    document.getElementById('photoGallery');

  const photoStatus =
    document.getElementById('photoStatus');

  const mobileToggle =
    document.querySelector(
      'input[name="setting"][value="Mobile visits"]'
    );

  const mobileAreasWrap =
    document.getElementById('mobileAreas');


  const requestedStep =
    parseInt(
      planParams.get('step') || '1',
      10
    );


  let current =
    Number.isFinite(requestedStep)
      ? Math.max(
          0,
          Math.min(
            steps.length - 1,
            requestedStep - 1
          )
        )
      : 0;


  let activePlan =
    incomingPlan || 'basic';


  const photoLimits = {
    basic: 2,
    plus: 6,
    premium: 10
  };


  let profilePhotos = [];
  let mainPhotoId = null;

  const removedPhotoPaths =
    new Set();



  const esc = value =>
    String(value || '')
      .replace(
        /[&<>"']/g,
        char => ({
          '&': '&amp;',
          '<': '&lt;',
          '>': '&gt;',
          '"': '&quot;',
          "'": '&#39;'
        }[char])
      );



  const safeSel = value =>
    window.CSS && CSS.escape
      ? CSS.escape(value)
      : String(value)
          .replace(
            /["\\]/g,
            '\\$&'
          );



  function currentPhotoLimit() {

    return photoLimits[activePlan] || 2;

  }



  function publicPhotoUrl(path) {

    if (!path || !sb) {
      return '';
    }


    const { data } =
      sb.storage
        .from('profile-photos')
        .getPublicUrl(path);


    return data?.publicUrl || '';

  }



  function renderPhotos() {

    if (!photoGallery) return;


    photoGallery.innerHTML = '';


    profilePhotos.forEach(photo => {

      const card =
        document.createElement('div');


      card.className =
        'photo-card' +
        (
          photo.id === mainPhotoId
            ? ' main'
            : ''
        );


      card.innerHTML = `

        ${
          photo.id === mainPhotoId
            ? '<span class="main-badge">MAIN</span>'
            : ''
        }

        <img alt="Therapist photo preview">

        <div class="photo-actions">

          <button
            type="button"
            class="make-main"
          >
            Make main
          </button>

          <button
            type="button"
            class="remove-photo"
          >
            Remove
          </button>

        </div>

      `;


      card.querySelector('img').src =
        photo.url;


      card
        .querySelector('.make-main')
        .onclick = () => {

          mainPhotoId =
            photo.id;

          renderPhotos();

        };


      card
        .querySelector('.remove-photo')
        .onclick = () => {

          if (photo.path) {
            removedPhotoPaths.add(
              photo.path
            );
          }


          if (
            photo.file &&
            photo.url.startsWith('blob:')
          ) {

            URL.revokeObjectURL(
              photo.url
            );

          }


          profilePhotos =
            profilePhotos.filter(
              item =>
                item.id !== photo.id
            );


          if (
            mainPhotoId === photo.id
          ) {

            mainPhotoId =
              profilePhotos[0]?.id ||
              null;

          }


          renderPhotos();

        };


      photoGallery.appendChild(
        card
      );

    });



    const limit =
      currentPhotoLimit();


    const planLabel =
      activePlan
        .charAt(0)
        .toUpperCase() +
      activePlan.slice(1);



    if (photoStatus) {

      photoStatus.textContent =
        profilePhotos.length
          ? `${profilePhotos.length} of ${limit} photos selected on your ${planLabel} plan.`
          : `No photos selected yet. Your ${planLabel} plan allows up to ${limit}.`;

    }



    const main =
      profilePhotos.find(
        photo =>
          photo.id === mainPhotoId
      );


    const previewPhoto =
      document.getElementById(
        'pvPhoto'
      );


    if (previewPhoto) {

      previewPhoto.style.backgroundImage =
        main
          ? `url("${main.url}")`
          : 'none';

    }

  }



  photoInput?.addEventListener(
    'change',
    () => {

      const files =
        [...photoInput.files];


      const allowed = [
        'image/jpeg',
        'image/png',
        'image/webp'
      ];


      const limit =
        currentPhotoLimit();



      for (const file of files) {

        if (
          profilePhotos.length >= limit
        ) {
          break;
        }


        if (
          !allowed.includes(file.type)
        ) {
          continue;
        }


        if (
          file.size >
          10 * 1024 * 1024
        ) {
          continue;
        }


        const id =
          crypto.randomUUID
            ? crypto.randomUUID()
            : `${Date.now()}-${Math.random()}`;


        const item = {

          id,

          file,

          path: null,

          url:
            URL.createObjectURL(file),

          name:
            file.name

        };


        profilePhotos.push(item);


        if (!mainPhotoId) {
          mainPhotoId =
            item.id;
        }

      }


      photoInput.value = '';


      renderPhotos();

    }
  );



  function renderStep() {

    steps.forEach(
      (step, index) =>
        step.classList.toggle(
          'active',
          index === current
        )
    );


    dots.forEach(
      (dot, index) =>
        dot.classList.toggle(
          'active',
          index <= current
        )
    );


    back.disabled =
      current === 0;


    next.textContent =
      current === steps.length - 1
        ? (
            isEdit
              ? 'Save changes'
              : 'Save profile'
          )
        : 'Continue';


    if (
      current ===
      steps.length - 1
    ) {
      preview();
    }


    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });

  }



  function emptyIfNeeded() {

    if (
      !selected.querySelector(
        '[data-name]'
      )
    ) {

      selected.innerHTML =
        '<div class="empty-menu">No treatments added yet.</div>';

    }

  }



  function removeTreatment(name) {

    selected
      .querySelector(
        `[data-name="${safeSel(name)}"]`
      )
      ?.remove();


    document
      .querySelector(
        `[data-treatment="${safeSel(name)}"]`
      )
      ?.classList.remove(
        'selected'
      );


    emptyIfNeeded();

  }



  function durationOption(
    name,
    minutes,
    value = ''
  ) {

    return `

      <label
        class="duration-option simple-duration"
      >

        <span>
          ${minutes} min
        </span>


        <span class="price-wrap">

          £

          <input
            type="number"
            class="duration-price"
            data-minutes="${minutes}"
            min="0"
            step="1"
            placeholder="${
              minutes === 30
                ? '35'
                : minutes === 60
                  ? '60'
                  : '85'
            }"
            aria-label="${esc(name)} ${minutes} minute price"
            value="${
              value !== ''
                ? esc(value)
                : ''
            }"
          >

        </span>

      </label>

    `;

  }



  function addTreatment(
    name,
    durations = []
  ) {

    name =
      (name || '').trim();


    if (
      !name ||
      selected.querySelector(
        `[data-name="${safeSel(name)}"]`
      )
    ) {

      return;

    }


    selected
      .querySelector('.empty-menu')
      ?.remove();



    const priceFor =
      minutes => {

        const found =
          durations.find(
            item =>
              Number(item?.minutes) ===
              Number(minutes)
          );


        return found?.price ?? '';

      };



    const row =
      document.createElement('div');


    row.className =
      'treatment-row';


    row.dataset.name =
      name;


    row.innerHTML = `

      <div class="treatment-head">

        <b>
          ${esc(name)}
        </b>

        <button
          type="button"
          class="remove-treatment"
        >
          Remove
        </button>

      </div>


      <div class="duration-grid">

        ${
          durationOption(
            name,
            30,
            priceFor(30)
          )
        }

        ${
          durationOption(
            name,
            60,
            priceFor(60)
          )
        }

        ${
          durationOption(
            name,
            90,
            priceFor(90)
          )
        }

      </div>

    `;


    selected.appendChild(row);


    row
      .querySelector(
        '.remove-treatment'
      )
      .onclick =
        () =>
          removeTreatment(name);

  }



  document
    .querySelectorAll(
      '[data-treatment]'
    )
    .forEach(button => {

      button.onclick =
        () => {

          const name =
            button.dataset.treatment;


          if (
            button.classList.contains(
              'selected'
            )
          ) {

            removeTreatment(name);

          }
          else {

            button.classList.add(
              'selected'
            );

            addTreatment(name);

          }

        };

    });



  const addCustom =
    document.getElementById(
      'addCustomTreatment'
    );


  addCustom?.addEventListener(
    'click',
    () => {

      const input =
        document.getElementById(
          'customTreatment'
        );


      const name =
        input.value.trim();


      if (name) {

        addTreatment(name);

        input.value = '';

      }

    }
  );



  const treatmentSearch =
    document.getElementById(
      'treatmentSearch'
    );


  treatmentSearch?.addEventListener(
    'input',
    () => {

      const query =
        treatmentSearch.value
          .toLowerCase();


      document
        .querySelectorAll(
          '.treatment-library section'
        )
        .forEach(section => {

          let visible = 0;


          section
            .querySelectorAll(
              '[data-treatment]'
            )
            .forEach(button => {

              const show =
                button.textContent
                  .toLowerCase()
                  .includes(query);


              button.style.display =
                show
                  ? ''
                  : 'none';


              if (show) {
                visible += 1;
              }

            });


          section.style.display =
            visible
              ? ''
              : 'none';

        });

    }
  );



  function syncMobile() {

    if (
      !mobileToggle ||
      !mobileAreasWrap
    ) {

      return;

    }


    mobileAreasWrap.hidden =
      !mobileToggle.checked;

  }


  mobileToggle?.addEventListener(
    'change',
    syncMobile
  );


  syncMobile();



  function preview() {

    renderPhotos();


    const data =
      new FormData(form);


    document.getElementById(
      'pvName'
    ).textContent =
      data.get('displayName') ||
      data.get('business') ||
      'Your name';


    document.getElementById(
      'pvPlace'
    ).textContent =
      [
        data.get('city'),
        data.get('postcode')
      ]
        .filter(Boolean)
        .join(' · ') ||
      'Your location';


    document.getElementById(
      'pvAbout'
    ).textContent =
      data.get('about') ||
      'Your introduction will appear here.';



    const rows =
      [
        ...selected.querySelectorAll(
          '[data-name]'
        )
      ];


    document.getElementById(
      'pvTreatments'
    ).innerHTML =
      rows
        .map(
          row =>
            `<span>${esc(row.dataset.name)}</span>`
        )
        .join('');



    const prices = [];
    const menu = [];


    rows.forEach(row => {

      const options = [];


      row
        .querySelectorAll(
          '.duration-price'
        )
        .forEach(input => {

          const price =
            Number(input.value);


          const minutes =
            Number(
              input.dataset.minutes
            );


          if (price > 0) {

            prices.push(price);

            options.push(
              `${minutes} min £${price}`
            );

          }

        });


      if (options.length) {

        menu.push(`

          <div class="menu-service">

            <strong>
              ${esc(row.dataset.name)}
            </strong>

            <span>
              ${options.join(' · ')}
            </span>

          </div>

        `);

      }

    });



    document.getElementById(
      'pvPrice'
    ).textContent =
      prices.length
        ? `Treatments from £${Math.min(...prices)}`
        : '';



    document.getElementById(
      'pvMenu'
    ).innerHTML =
      menu.length
        ? `<h3>Treatment menu</h3>${menu.join('')}`
        : '';



    const settings =
      data.getAll('setting');


    const area =
      data.get('areas');


    const bits = [];


    if (settings.length) {

      bits.push(
        settings.join(' · ')
      );

    }


    if (
      mobileToggle?.checked &&
      area
    ) {

      bits.push(
        `Areas covered: ${area}`
      );

    }



    const pvPractice =
      document.getElementById(
        'pvPractice'
      );


    pvPractice.textContent =
      bits.join(' | ');


    pvPractice.hidden =
      !bits.length;



    document.getElementById(
      'pvBadges'
    ).innerHTML =
      settings
        .map(
          item =>
            `<span>${esc(item)}</span>`
        )
        .join('');



    const phone =
      data.get('phone');

    const email =
      data.get('email');

    const website =
      data.get('website');

    const contacts = [];


    if (phone) {

      contacts.push(
        `<span>☎ ${esc(phone)}</span>`
      );

    }


    if (email) {

      contacts.push(
        `<span>✉ ${esc(email)}</span>`
      );

    }


    if (website) {

      contacts.push(
        `<span>↗ ${esc(website)}</span>`
      );

    }



    const contact =
      document.getElementById(
        'pvContact'
      );


    document.getElementById(
      'pvContactLinks'
    ).innerHTML =
      contacts.join('');


    contact.hidden =
      !contacts.length;

  }



  function normalisePhotoPaths(
    value
  ) {

    if (Array.isArray(value)) {

      return value.filter(Boolean);

    }


    if (
      typeof value === 'string' &&
      value.trim()
    ) {

      try {

        const parsed =
          JSON.parse(value);


        return Array.isArray(parsed)
          ? parsed.filter(Boolean)
          : [];

      }
      catch {

        return [];

      }

    }


    return [];

  }



  async function loadEditProfile() {

    if (!isEdit) return;

    if (!sb) return;


    const {
      data: { user }
    } =
      await sb.auth.getUser();


    if (!user) {

      window.location.replace(
        loginRedirectUrl()
      );

      return;

    }



    const {
      data: profile,
      error
    } =
      await sb
        .from('profiles')
        .select('*')
        .eq(
          'user_id',
          user.id
        )
        .order(
          'created_at',
          {
            ascending: false
          }
        )
        .limit(1)
        .maybeSingle();



    if (error) {

      console.error(error);

      alert(
        'Could not load your profile.'
      );

      return;

    }


    if (!profile) return;



    if (
      validPlans.includes(
        String(
          profile.plan || ''
        ).toLowerCase()
      )
    ) {

      activePlan =
        String(
          profile.plan
        ).toLowerCase();

    }



    form.elements.displayName.value =
      profile.display_name || '';

    form.elements.business.value =
      profile.business_name || '';

    form.elements.about.value =
      profile.bio || '';

    form.elements.phone.value =
      profile.phone || '';

    form.elements.email.value =
      profile.email || '';

    form.elements.website.value =
      profile.website || '';



    const locationParts =
      String(
        profile.location || ''
      )
        .split(' · ');


    form.elements.city.value =
      locationParts[0] || '';

    form.elements.postcode.value =
      locationParts[1] || '';

    form.elements.areas.value =
      profile.mobile_areas ||
      profile.areas ||
      '';



    const savedSettings =
      String(
        profile.settings || ''
      )
        .split(' · ')
        .filter(Boolean);



    form
      .querySelectorAll(
        'input[name="setting"]'
      )
      .forEach(checkbox => {

        checkbox.checked =
          savedSettings.includes(
            checkbox.value
          );

      });


    syncMobile();



    selected.innerHTML = '';


    (
      Array.isArray(
        profile.treatments
      )
        ? profile.treatments
        : []
    )
      .forEach(treatment => {

        if (!treatment?.name) {
          return;
        }


        addTreatment(
          treatment.name,
          Array.isArray(
            treatment.durations
          )
            ? treatment.durations
            : []
        );


        document
          .querySelector(
            `[data-treatment="${safeSel(treatment.name)}"]`
          )
          ?.classList.add(
            'selected'
          );

      });


    emptyIfNeeded();



    const savedPaths =
      normalisePhotoPaths(
        profile.photo_paths
      );


    profilePhotos =
      savedPaths.map(path => ({

        id: path,

        path,

        file: null,

        url:
          publicPhotoUrl(path),

        name:
          path
            .split('/')
            .pop() ||
          'photo'

      }));



    const savedMain =
      profile.main_photo_path ||
      savedPaths[0] ||
      null;



    mainPhotoId =
      profilePhotos.find(
        photo =>
          photo.path === savedMain
      )?.id ||
      profilePhotos[0]?.id ||
      null;


    renderPhotos();

  }



  async function ensureUser() {

    if (!sb) {

      throw new Error(
        'MassageMatch connection did not load. Please refresh and try again.'
      );

    }


    const {
      data: { user },
      error: userError
    } =
      await sb.auth.getUser();


    if (userError) {
      throw userError;
    }


    if (!user) {

      window.location.replace(
        loginRedirectUrl()
      );

      throw new Error(
        'Please log in to continue.'
      );

    }


    return user;

  }


  function fileExtension(file) {

    const fromName =
      String(
        file.name || ''
      )
        .split('.')
        .pop()
        .toLowerCase();


    if (
      [
        'jpg',
        'jpeg',
        'png',
        'webp'
      ]
        .includes(fromName)
    ) {

      return fromName === 'jpeg'
        ? 'jpg'
        : fromName;

    }


    if (
      file.type === 'image/png'
    ) {

      return 'png';

    }


    if (
      file.type === 'image/webp'
    ) {

      return 'webp';

    }


    return 'jpg';

  }



  async function uploadNewPhotos(
    user
  ) {

    const limit =
      currentPhotoLimit();


    if (
      profilePhotos.length >
      limit
    ) {

      throw new Error(
        `Your ${activePlan} plan allows up to ${limit} profile photos.`
      );

    }



    for (
      const photo
      of profilePhotos
    ) {

      if (
        !photo.file ||
        photo.path
      ) {

        continue;

      }



      const unique =
        crypto.randomUUID
          ? crypto.randomUUID()
          : `${Date.now()}-${Math.random()
              .toString(36)
              .slice(2)}`;



      const path =
        `${user.id}/${unique}.${fileExtension(photo.file)}`;



      const { error } =
        await sb.storage
          .from(
            'profile-photos'
          )
          .upload(
            path,
            photo.file,
            {
              cacheControl: '3600',
              upsert: false,
              contentType:
                photo.file.type
            }
          );


      if (error) {
        throw error;
      }



      photo.path =
        path;


      photo.url =
        publicPhotoUrl(path);

    }

  }



  async function removeOldPhotos() {

    const paths =
      [...removedPhotoPaths]
        .filter(Boolean);


    if (!paths.length) {
      return;
    }



    const { error } =
      await sb.storage
        .from(
          'profile-photos'
        )
        .remove(paths);



    if (error) {

      console.warn(
        'Profile saved, but old photo cleanup failed:',
        error
      );

      return;

    }


    removedPhotoPaths.clear();

  }



  function collectTreatments() {

    return [
      ...selected.querySelectorAll(
        '[data-name]'
      )
    ]
      .map(row => ({

        name:
          row.dataset.name,

        durations:
          [
            ...row.querySelectorAll(
              '.duration-price'
            )
          ]
            .map(input => ({

              minutes:
                Number(
                  input.dataset.minutes
                ),

              price:
                Number(
                  input.value
                )

            }))
            .filter(
              option =>
                Number.isFinite(
                  option.price
                ) &&
                option.price > 0
            )

      }));

  }



  const saveProfile =
    async () => {


      const data =
        new FormData(form);


      if (!sb) {

        alert(
          'MassageMatch connection did not load. Please refresh and try again.'
        );

        return;

      }



      next.disabled = true;


      next.textContent =
        isEdit
          ? 'Saving...'
          : 'Submitting...';



      try {

        const user =
          await ensureUser();


        await uploadNewPhotos(
          user
        );


        const treatments =
          collectTreatments();


        const photoPaths =
          profilePhotos
            .map(
              photo =>
                photo.path
            )
            .filter(Boolean);



        const mainPhoto =
          profilePhotos.find(
            photo =>
              photo.id ===
              mainPhotoId
          );



        const mainPhotoPath =
          mainPhoto?.path ||
          photoPaths[0] ||
          null;



        const profile = {

          user_id:
            user.id,

          display_name:
            data.get(
              'displayName'
            ),

          business_name:
            data.get(
              'business'
            ),

          bio:
            data.get(
              'about'
            ),

          phone:
            data.get(
              'phone'
            ),

          email:
            data.get(
              'email'
            ),

          website:
            data.get(
              'website'
            ),

          location:
            [
              data.get('city'),
              data.get('postcode')
            ]
              .filter(Boolean)
              .join(' · '),

          areas:
            data.get('areas') ||
            '',

          settings:
            data
              .getAll(
                'setting'
              )
              .join(' · '),

          treatments,

          mobile:
            data
              .getAll(
                'setting'
              )
              .includes(
                'Mobile visits'
              ),

          mobile_areas:
            data
              .getAll(
                'setting'
              )
              .includes(
                'Mobile visits'
              )
                ? (
                    data.get(
                      'areas'
                    ) ||
                    ''
                  )
                : '',

          photo_paths:
            photoPaths,

          main_photo_path:
            mainPhotoPath,

          plan:
            activePlan,

          subscription_status:
            'pending_payment',

          featured:
            false

        };



        if (isEdit) {

          const {
            plan,
            subscription_status,
            featured,
            ...profileUpdates
          } =
            profile;



          const { error } =
            await sb
              .from(
                'profiles'
              )
              .update(
                profileUpdates
              )
              .eq(
                'user_id',
                user.id
              );


          if (error) {
            throw error;
          }



          await removeOldPhotos();



          window.location.href =
            'dashboard.html?profile=updated';


          return;

        }



        const { error } =
          await sb
            .from('profiles')
            .insert(profile);


        if (error) {
          throw error;
        }



        const monthlyPrices = {

          basic: '£10',

          plus: '£15',

          premium: '£20'

        };



        const monthlyPrice =
          monthlyPrices[
            activePlan
          ] ||
          'your selected monthly price';



        const continueToPayment =
          confirm(
            `You pay £0 today.\n\nYour first 2 months are free.\n\nAfter that, your membership automatically continues at ${monthlyPrice} per month until cancelled.\n\nContinue to secure checkout?`
          );



        if (!continueToPayment) {

          next.disabled = false;

          next.textContent =
            'Continue to checkout';

          return;

        }



        next.textContent =
          'Opening secure checkout...';



        const {
          data: checkout,
          error: checkoutError
        } =
          await sb.functions.invoke(
            'square-subscription-checkout',
            {
              body: {
                plan:
                  activePlan,

                user_id:
                  user.id
              }
            }
          );


        if (checkoutError) {
          throw checkoutError;
        }


        if (!checkout?.url) {

          throw new Error(
            'Square checkout link was not returned.'
          );

        }


        window.location.href =
          checkout.url;


      }
      catch (error) {

        console.error(error);


        next.disabled = false;


        next.textContent =
          isEdit
            ? 'Save changes'
            : 'Submit for review';


        alert(
          'Could not save profile: ' +
          (
            error.message ||
            'Please try again.'
          )
        );

      }

    };



  back.onclick =
    event => {

      event.preventDefault();


      if (current > 0) {

        current -= 1;

        renderStep();

      }

    };



  next.onclick =
    async () => {


      if (
        steps[current]
          ?.querySelector(
            'input[name="insured"]'
          )
      ) {

        const insured =
          form.elements
            .insured
            ?.checked;


        const rules =
          form.elements
            .rules
            ?.checked;


        if (
          !insured ||
          !rules
        ) {

          alert(
            'Please confirm your professional insurance and agree to the MassageMatch professional service rules before continuing.'
          );

          return;

        }

      }



      if (
        current <
        steps.length - 1
      ) {

        current += 1;

        renderStep();

      }
      else {

        await saveProfile();

      }

    };



  loadEditProfile()
    .then(renderStep);

})();
