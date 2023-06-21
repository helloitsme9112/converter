(() => {
  const selects = document.querySelectorAll('.header__select')
  const [fromSelect, toSelect] = selects
  const input = document.querySelector('.header__input')
  const result = document.querySelector('.header__result')
  const table = document.querySelector('.table')
  const thead = document.querySelector('thead')
  const tbody = document.querySelector('tbody')
  const swap = document.querySelector('.header__button')
  const body = document.querySelector('body')

  let timerId

  // вспомогательный объект для генерации адаптивной таблицы
  const list = {
    CharCode: 'Код',
    Nominal: 'Единица',
    Name: 'Валюта',
    Value: 'Курс базовой валюты',
  }

  function createOption(Name, CharCode, select) {
    const $Option = document.createElement('option')
    const $SpanLeft = document.createElement('span')
    const $SpanRight = document.createElement('span')

    $SpanLeft.textContent = `${Name} `
    $SpanRight.textContent = CharCode
    $Option.value = CharCode

    $Option.append($SpanLeft)
    $Option.append($SpanRight)
    select.append($Option)
  }

  function tHead() {
    const $TRow = document.createElement('tr')

    for (const key in list) {
      const $Th = document.createElement('th')

      $Th.textContent = list[key]
      $Th.classList.add(key.toLowerCase(), `th-${key.toLowerCase()}`)

      $TRow.append($Th)
    }

    thead.append($TRow)
    table.prepend(thead)

    return table
  }

  function createFlagBlock(obj) {
    const wrapper = document.createElement('div')
    const img = document.createElement('img')
    const name = document.createElement('span')

    img.src = `img/${obj.CharCode}.svg`
    img.alt = obj.CharCode
    name.textContent = obj.CharCode

    wrapper.append(img, name)
    wrapper.classList.add('td-container')

    return wrapper
  }

  function generateClassNamesStrings(obj, key, spec) {
    const general = `${Object.keys(list)[key].toLowerCase()}`
    const specified = `${Object.keys(obj)[key].toLowerCase()}--${spec}`
    return {
      general,
      specified
    }
  }

  function concatClassNamesStrings(item, obj, key, direction) {
    return item.classList.add(
      generateClassNamesStrings(obj, key).general,
      generateClassNamesStrings(obj, key, direction).specified
    )
  }

  function generateTableDesktop(obj) {
    const $TRow = document.createElement('tr')

    for (const key in obj) {
      const $Td = document.createElement('td')
      if (key === 'CharCode') {
        // исключением обрабатывается только блок с флагом, его отдельно выносим в иф
        $Td.append(createFlagBlock(obj))
        $Td.classList.add(`${key.toLowerCase()}`, `td-${key.toLowerCase()}`)
      } else {
        // все остальные случаи обрабатываются по шаблону
        $Td.textContent = obj[key]
        $Td.classList.add(`${key.toLowerCase()}`, `td-${key.toLowerCase()}`)
      }
      $TRow.append($Td)
      tbody.append($TRow)
    }
  }

  // function

  function createTdLeftTablet(obj, item, key) {
    item.textContent = Object.values(list)[key]
    concatClassNamesStrings(item, obj, key, 'left')
  }

  function generateTableTablet(obj) {
    for (let key = 0; key < Object.keys(obj).length; key++) {
      const $TRow = document.createElement('tr')
      const $TdLeft = document.createElement('td')
      const $TdRight = document.createElement('td')

      // делаем через обычный фор, чтобы получить числовой индекс
      // переводим ключи/значения объектов для колонок в массив и выбираем результат от индекса
      if (Object.keys(obj)[key] === "CharCode") {
        // исключением обрабатывается только блок с флагом, его отдельно выносим в иф
        // левая колонка привязана к значениям объекта list
        createTdLeftTablet(obj, $TdLeft, key)

        // правая колонка привязана к значениям объекта с сервера
        $TdRight.append(createFlagBlock(obj))

        concatClassNamesStrings($TdRight, obj, key, 'right')

        $TRow.append($TdLeft, $TdRight)
      } else {

        createTdLeftTablet(obj, $TdLeft, key)

        $TdRight.textContent = Object.values(obj)[key]

        concatClassNamesStrings($TdRight, obj, key, 'right')

        $TRow.append($TdLeft, $TdRight)
      }

      tbody.append($TRow)
    }
  }

  function templateObjFraction(obj, booleanInit, booleanOpt, fn) {
    for (const key in obj) {
      const minorObj = {
        CharCode: obj[key].CharCode,
        Nominal: obj[key].Nominal,
        Name: obj[key].Name,
        Value: obj[key].Value
      }

      // эта функция нужна только при первой отрисовке
      if (booleanInit) {
        selects.forEach(e => createOption(minorObj.Name, minorObj.CharCode, e))
      }

      // эта функция нужна только при первой отрисовке
      if (booleanOpt) {
        window.matchMedia("(max-width: 1024px)").matches
          ? generateTableTablet(minorObj)
          : generateTableDesktop(minorObj)
      }

      // эта функция передается опционально в зависимости от разрешения на адаптиве
      if (fn) {
        fn(minorObj)
      }
    }
  }

  function createCloseBtn() {
    const drops = document.querySelectorAll('.choices__list--dropdown')

    drops.forEach(e => {
      const btn = document.createElement('button')
      btn.classList.add('close-button', 'btn-reset')

      btn.addEventListener('click', () => {
        e.classList.toggle('is-active')
        e.querySelector('.choices__input').value = ''
      })

      e.prepend(btn)
    })
  }

  function layout(obj) {
    selects.forEach(e => createOption('Российский рубль ', 'RUR', e))

    // проверка первого рендера
    if (!window.matchMedia("(max-width: 1024px)").matches) {
      tHead()
    }

    // дробление серверного объекта на подобъекты
    templateObjFraction(obj, 1, 1)

    //
    window.matchMedia("(max-width: 1024px)").addEventListener('change', e => {
      thead.innerHTML = ''
      tbody.innerHTML = ''
      if (e.matches) {
        templateObjFraction(obj, 0, 0, generateTableTablet)
      } else {
        tHead()
        templateObjFraction(obj, 0, 0, generateTableDesktop)
      }
    })
  }

  function conversion(rates) {
    const fromValue = fromSelect.querySelector('option').getAttribute('value'),
          toValue = toSelect.querySelector('option').getAttribute('value')

    if (fromValue === "RUR") {
      const courseTo = rates[toValue].Value
      const nominalTo = rates[toValue].Nominal

      result.textContent = (+input.value / courseTo * nominalTo).toFixed(4)
    } else if (toValue === "RUR") {
      const courseFrom = rates[fromValue].Value
      const nominalFrom = rates[fromValue].Nominal

      result.textContent = (+input.value * courseFrom / nominalFrom).toFixed(4)
    } else {
      result.textContent = fx(+input.value).from(fromSelect.value).to(toSelect.value).toFixed(4)
    }
  }

  function generateDateStrings(obj) {
    const today = new Date(obj.Date)

    const day = today.getDate()
    let month = today.getMonth() + 1
    const year = today.getFullYear()

    if (month < 10) {
      month = '0' + month
    }

    return {
      day,
      month,
      year
    }
  }

  function renderDate(obj) {
    const h2 = document.querySelector('.table__h2')
    h2.textContent = `курсы валют на ${generateDateStrings(obj).day}.${generateDateStrings(obj).month}.${generateDateStrings(obj).year}`
  }

  ['copy', 'cut', 'paste'].forEach(e => {
    input.addEventListener(e, evt => evt.preventDefault())
  })

  input.addEventListener('keypress', e => {
    // const digits = new RegExp(/(?:^\d+$)|\,+$|\.+$/) дробные числа
    const digits = new RegExp(/^\d+$/) //только целые числа

    if (!digits.test(e.key)) {
      e.preventDefault()
    } else if (toSelect.value !== "") {
        clearTimeout(timerId)
        timerId = setTimeout(() => {
          conversion(rates)
        }, 300)
    }
  })

  async function app() {
    const data = await fetch('https://www.cbr-xml-daily.ru/daily_json.js')
      .then(function (response) {
        console.log('loaded')
        setTimeout(() => {
          document.querySelector('header').classList.remove('hidden')
          document.querySelector('main').classList.remove('hidden')
          document.querySelector('.loader').remove()
        }, 1000)
        return response.json()
      },
        function (err) {
          console.error(err.message)
          return
        })

    renderDate(data)
    console.log(data)

    for (const key in data.Valute) {
      data.Valute[key].Value = data.Valute[key].Value.toFixed(4)
    }
    const rates = data.Valute
    console.log(rates)

    layout(rates)

    const choicesOpt = {
      searchResultLimit: 20,
      position: 'bottom',
      allowHTML: true,
      itemSelectText: '',
      searchPlaceholderValue: 'Что будем искать?',
      noResultsText: 'Попробуйте еще раз!',
      loadingText: 'Загрузка...',
      placeholder: true,
      placeholderValue: 'Выберите валюту',
      duplicateItemsAllowed: false,
     }

    const choicesLeft = new Choices(fromSelect, choicesOpt)
    const choicesRight = new Choices(toSelect, choicesOpt)

    createCloseBtn()

    selects.forEach(e => e.addEventListener('showDropdown', () => {
      body.classList.toggle('stop-scroll')
    }))

    selects.forEach(e => e.addEventListener('hideDropdown', () => {
      body.classList.toggle('stop-scroll')
      if (e.querySelector('option').value !== "") {
        e.closest('.choices__inner').style.cssText = 'background-color: #287EA2'
      }
    }))

    selects.forEach(e => e.addEventListener('addItem', () => {
      [choicesLeft, choicesRight].forEach(el =>
        // удаляет все объекты, которые добавляются после choicesInstance.setValue()
        el._currentState.choices.splice(Object.keys(rates).length))
    }))

    selects.forEach(e => {
      e.addEventListener('change', () => {
        if (toSelect.value !== "" && input.value) {
          conversion(rates)
        }
      })
    })

    swap.addEventListener('click', () => {
      if (fromSelect.querySelector('option').getAttribute('value') == "" || toSelect.querySelector('option').getAttribute('value') == "") {
        console.log('forbidden action')
        alert('Выберите оба типа валют.')
        return
      }

      const value1 = choicesLeft.getValue()
      const value2 = choicesRight.getValue()

      choicesLeft.setValue([{value: value2.value, label: value2.label}])
      choicesRight.setValue([{value: value1.value, label: value1.label}])

      if (fromSelect.querySelector('option').getAttribute('value')
          && toSelect.querySelector('option').getAttribute('value')
          && input.value) {
        input.value = result.textContent
        conversion(rates)
      }
    })
  }
  window.app = app;
})()
