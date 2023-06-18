(() => {
  const selects = document.querySelectorAll('.header__select');
  const [fromSelect, toSelect] = selects;
  const input = document.querySelector('.header__input');
  const result = document.querySelector('.header__result');
  const table = document.querySelector('.table');
  const thead = document.querySelector('thead');
  const tbody = document.querySelector('tbody');
  const swap = document.querySelector('.header__button');

  let timerId

  const list = {
    CharCode: 'Код',
    Nominal: 'Единица',
    Name: 'Валюта',
    Value: 'Курс базовой валюты',
  }

  async function getData() {
    const response = await fetch('https://www.cbr-xml-daily.ru/daily_json.js');
    return await response.json()
  }

  function createOption(Name, CharCode, select) {
    const $Option = document.createElement('option')
    const $SpanLeft = document.createElement('span')
    const $SpanRight = document.createElement('span')

    $SpanLeft.textContent = `${Name} `
    $SpanRight.textContent = CharCode
    $Option.value = CharCode

    if(CharCode === 'RUR' && select == fromSelect) {
      // $Option.setAttribute('selected', 'true')
    }

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

  function generateClassNameString(obj, key, spec) {
    const general = `${Object.keys(list)[key].toLowerCase()}`
    const specified = `${Object.keys(obj)[key].toLowerCase()}--${spec}`
    return {
      general,
      specified
    }
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
        $TdLeft.textContent = Object.values(list)[key]
        $TdLeft.classList.add(
          generateClassNameString(obj, key).general,
          generateClassNameString(obj, key, 'left').specified
        )

        // правая колонка привязана к значениям объекта с сервера
        $TdRight.append(createFlagBlock(obj))
        $TdRight.classList.add(
          generateClassNameString(obj, key).general,
          generateClassNameString(obj, key, 'right').specified
        )

        $TRow.append($TdLeft, $TdRight)
      } else {
        $TdLeft.textContent = Object.values(list)[key]
        $TdLeft.classList.add(
          generateClassNameString(obj, key).general,
          generateClassNameString(obj, key, 'left').specified
        )

        $TdRight.textContent = Object.values(obj)[key]
        $TdRight.classList.add(
          generateClassNameString(obj, key).general,
          generateClassNameString(obj, key, 'right').specified
        )

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

  function layout(obj) {
    selects.forEach(e => createOption('Российский рубль ', 'RUR', e))

    if (!window.matchMedia("(max-width: 1024px)").matches) {
      tHead()
    }

    templateObjFraction(obj, 1, 1)

    window.matchMedia("(max-width: 1024px)").addEventListener('change', e => {
      thead.innerHTML = ''
      tbody.innerHTML = ''
      if (e.matches) {
        templateObjFraction(obj, 0, 0, template)
      } else {
        tHead()
        templateObjFraction(obj, 0, 0, generateTableDesktop)
      }
    })

    selects.forEach(e => new Choices(e, {
      searchResultLimit: 20,
      position: 'bottom',
      allowHTML: true,
      itemSelectText: '',
      searchPlaceholderValue: 'Что будем искать?',
      noResultsText: 'Ничего не найдено',
      loadingText: 'Загрузка...',
      placeholder: true,
      placeholderValue: 'Выберите валюту',
     }))
  }

  function conversion(rates) {
    if (fromSelect.querySelector('option').getAttribute('value') === "RUR") {
      result.textContent = (+input.value * rates[toSelect.querySelector('option').getAttribute('value')].Value).toFixed(4)
    } else {
      result.textContent = fx(+input.value).from(fromSelect.value).to(toSelect.value).toFixed(4);
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

  async function app() {
    const data = await getData()

    if (!data) {
      return
    }

    renderDate(data)
    console.log(data)

    for (const key in data.Valute) {
      data.Valute[key].Value = data.Valute[key].Value.toFixed(4)
    }
    const rates = data.Valute
    console.log(rates)
    layout(rates)

    input.addEventListener('keypress', e => {
      const digits = new RegExp(/(?:^\d+$)|\,+$|\.+$/),
            comma = new RegExp(/\,/)

      // if (!digits.test(e.key)) {
      //   e.preventDefault()
      // } else if (toSelect.value !== "") {
      //   if (comma.test(e.key)) {
      //     console.log(e.key)
      //   }
      //   clearTimeout(timerId)
      //   timerId = setTimeout(() => {
      //     conversion(rates)
      //   }, 300)
      // }
      console.log(e.data)
      if (!digits.test(e.key)) {
        e.preventDefault()
      } else {
          clearTimeout(timerId)
          timerId = setTimeout(() => {
            conversion(rates)
          }, 300)
      }
    })

    selects.forEach(e => {
      e.addEventListener('change', () => {
        if (toSelect.value !== "" && input.value) {
          conversion(rates)
        }
      })
    })


    swap.addEventListener('click', () => {
      const choicesLeft = document.querySelector('.wrapper--left > .choices > .choices__list--dropdown > .choices__list')
      const choicesRight = document.querySelector('.wrapper--right > .choices > .choices__list--dropdown > .choices__list')

      const selectFromValue = fromSelect.querySelector('option').getAttribute('value')
      // console.log(selectFromInnerText)
      const selectToValue = toSelect.querySelector('option').getAttribute('value')
      // console.log(selectToInnerText)


      // ищем активную опцию селекта
      // убираем активность
      // ищем в дропе по дата-вэлью от противопроложного селекта
      // добавляем активность
      // ЭТИ БЛОКИ НЕ ДАЮТ ВИДИМЫХ ИЗМЕНЕНИЙ, ТК НЕ ЗАПУСКАЕТСЯ ПОДКАПОТНАЯ ЛОГИКА CHOICES.JS ОТ КЛИКА ПО АЙТЕМУ
      const selectedLeft = choicesLeft.querySelector('.is-selected')
      selectedLeft.classList.remove('is-selected')
      choicesLeft.querySelector(`[data-value="${selectToValue}"]`).classList.add('is-selected')

      const selectedRight = choicesRight.querySelector('.is-selected')
      selectedRight.classList.remove('is-selected')
      choicesRight.querySelector(`[data-value="${selectFromValue}"]`).classList.add('is-selected')

      const selectFields = document.querySelectorAll('.choices__list--single > div')
      const valueLeft = selectFields[0].querySelectorAll('span')
      const inputValue = input.value
      const resultValue = +result.textContent
      console.log(resultValue)
      const valueRight = selectFields[1].querySelectorAll('span')
      console.log(valueLeft, valueRight)
      selectFields.forEach(e => e.innerHTML='')
      selectFields[0].append(valueRight[0], valueRight[1])
      selectFields[0].setAttribute('value', selectToValue)
      input.value = resultValue.replace(0)

      selectFields[1].append(valueLeft[0], valueLeft[1])
      selectFields[1].setAttribute('value', selectFromValue)
      result.textContent = conversion(rates)
    })
  }
  window.app = app;
})()
