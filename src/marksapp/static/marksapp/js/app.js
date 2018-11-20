$.fn.focusTextToEnd = function() {
  this.focus();
  let $thisVal = this.val();
  this.val('').val($thisVal);
  return this;
};

const root_url = "/";
let params = new URLSearchParams(location.search);
let all_tags = "";
let selectedIdx = -1;
let lastPrefix = "";

function splitTags(string) {
  return string.trim().split(/[\s,]+/);
}

function changeParams(func) {
  func();
  window.history.replaceState({}, '', `${location.pathname}?${params}`);
}

function getAllTags() {
  $.ajax({
    url: root_url + 'api/tags/',
    dataType: 'json',
    success: function(data) {
      all_tags = data["tags"];
    }
  });
}

function loadMark(id) {
  $.ajax({
    url: root_url + 'api/mark/' + id,
    data: {
      'id': id
    },
    dataType: 'json',
    success: function(data) {
      console.log(data);
    }
  });
}

function editMarkForm(id, form) {
  $.ajax({
    url: root_url + 'block/mark/' + id,
    dataType: 'html',
    success: function(data) {
      appendForm(data, form);
      $("#id_name").focusTextToEnd();
      $("#id_description").prop("style").height = $("#id_description").prop("scrollHeight") + "px";

    }
  });
}

function getTitle(url) {
  $.ajax({
    type: "POST",
    url: root_url + 'api/get_title/',
    data: {'url': url},
    dataType: 'json',
    success: function(data) {
      if (!("error" in data)) {
        if ($("#id_name").val() == "") {
          $("#id_name").val(data["url"]);
        }
      }
    }
  });
}

function editMark(id) {
  $.post({
    url: root_url + 'block/mark',
    data: $("#editform" + id).serialize(),
    success: function(data) {
      console.log(data);
    }
  });
}

function deleteMark(id) {
  $.post({
    url: root_url + 'api/delete_mark/' + id + '/',
    success: function(data) {
      console.log(data);
      location.reload();
    }
  });
}

function deleteMarks() {
  $.post({
    url: root_url + 'api/delete_marks/',
    data: $("#edit_multiple_form").serialize(),
    success: function(data) {
      location.reload();
    }
  });
}

function bumpMark(id) {
  $.post({
    url: root_url + 'api/bump_mark/' + id + '/',
    success: function(data) {
      console.log(data);
      location.reload();
    }
  });
}

function appendForm(form, el) {
  el.parent().parent().append(form);
}

function filterSuggestions(prefix, field) {
  let list = $("#suggestions");
  if (prefix) {
    list.empty();

    for (i = 0; i < all_tags.length; ++i) {
      if (all_tags[i]["name"].startsWith(prefix)) {
        numberElement = $("<span/>").text(all_tags[i]["num_marks"]);
        numberElement.addClass("number");

        tagName = $("<a/>").text(all_tags[i]["name"]);
        tagName.addClass("tag-name");

        let listElement = $("<li/>").append(tagName);
        listElement.append(numberElement);

        if (prefix == all_tags[i]["name"]) {
          listElement.addClass("match");
        }

        list.append(listElement);
      }
    }

    if (list.children().length > 0) {
      offset = field.offset();
      input_height = field.outerHeight();
      $("#suggestions").css({'top' : (offset.top + input_height) + 'px',
                             'left' : (offset.left) + 'px',
                             'display': 'block'});
    } else {
      $("#suggestions").css({'display': 'none'});
    }
  } else {
    $("#suggestions").css({'display': 'none'});
  }
}

function completeWithSuggestedTag(selectedTag, field) {
  let tags = splitTags(field.val());
  let last = tags[tags.length - 1].replace(/ /g,'');
  if (last[0] == "-") { last = last.substr(1); }

  if (last != selectedTag) {
    field.val(field.val() + selectedTag.slice(last.length - selectedTag.length));
  }

  $("#suggestions").css({'display': 'none'});
  selectedIdx = -1;
}

$(function() {
  populateWithSearchParams();
  getAllTags();

  if (params.get("expand") == "all") {
    $(".description-container").show();
  }

  let mark_id = 0;

  $("#suggestions").on("click", "li", function() {
    let fullTag = $(this).find("a").text();
    completeWithSuggestedTag(fullTag, $(document.activeElement));
  });

  $(".edit_btn").click(function(e) {
    e.preventDefault();
    if ($("#edit_mark_form")) {
      $("#edit_mark_form").remove();
    }

    mark_id = $(this).attr("mark_id");
    editMarkForm(mark_id, $(this));
  });

  $(".delete_btn").click(function(e) {
    e.preventDefault();
    if (confirm('Are you sure?')) {
      mark_id = $(this).attr("mark_id");
      deleteMark(mark_id);
    }
  });

  $(".bump_btn").click(function(e) {
    e.preventDefault();
    mark_id = $(this).attr("mark_id");
    bumpMark(mark_id);
  });

  $(".info_btn").click(function(e) {
    e.preventDefault();
    mark_id = $(this).attr("mark_id");
    $(".description-container[mark_id='" + mark_id + "']").toggle();
  });

  $(".expand_all_btn").click(function(e) {
    e.preventDefault();
    $(".description-container").show();
    params.set("expand", "all");
    window.history.replaceState({}, '', `${location.pathname}?${params}`);
    changeParams(function() {
      params.set("expand", "all");
    }); // maybe a bit too clever
  });

  $(".collapse_all_btn").click(function(e) {
    e.preventDefault();
    $(".description-container").hide();
    changeParams(function() {
      params.delete("expand");
    });
  });

  $(".edit_multiple_btn").click(function(e) {
    e.preventDefault();
    $(".edit_checkbox").css({'display': 'inline'});
    $(".edit_multiple_form").css({'display': 'block'});
    $(".selected_actions").css({'display': 'block'});
    $("#id_add_tags").focus();
  });

  $(".remove_selected_btn").click(function(e) {
    e.preventDefault();
    deleteMarks();
  });

  $(".select_all_btn").click(function(e) {
    e.preventDefault();
    $(".edit_checkbox").prop('checked', true);
  });

  $(".deselect_all_btn").click(function(e) {
    e.preventDefault();
    $(".edit_checkbox").prop('checked', false);
  });

  $(document).on("submit", "#edit_multiple_form", (function(e) {
    e.preventDefault();
    $.post({
      url: root_url + 'api/edit_multiple/',
      data: $(this).serialize(),
      success: function(data) {
        location.reload();
      }
    });
  }));

  $(document).on("submit", "#edit_mark_form", (function(e) {
    e.preventDefault();
    $.post({
      url: root_url + 'block/mark/' + mark_id + '/',
      data: $(this).serialize(),
      success: function(data) {
        location.reload();
      }
    });
  }));

  $("#select_all").click(function(e) {
    e.preventDefault();
    $(':checkbox').each(function() {
      this.checked = true;
    });
  });

  $("#deselect_all").click(function(e) {
    e.preventDefault();
    $(':checkbox').each(function() {
      this.checked = false;
    });
  });

  $("#tags_selected_form").submit(function(e) {
    e.preventDefault();

    $.post({
      url: root_url + 'edit_selection/',
      data: $(this).serialize(),
      success: function(data) {
        location.reload();
      }
    });
  });

  $("#show_search_btn").click(function() {
    $("#search_form").show();
    $("#id_search_title").focus();
  });

  $(document).on("change", "#id_url", function(e) {
    if ($("#id_name").val() == "") {
      getTitle($("#id_url").val());
    }
  });

  // autocomplete ------------------

  $(document).on("keyup click focus", ".tag_field", function(e) {
    let tagsStr = $(this).val();

    // autocomplete should display when:
    // caret is on the last character
    // user is not selecting text
    if (tagsStr.substr(-1) != " " &&
        tagsStr.length == this.selectionStart &&
        this.selectionStart == this.selectionEnd) {
      let tags = splitTags(tagsStr);
      let last = tags[tags.length - 1].replace(/ /g, '');
      if (last[0] == "-") { last = last.substr(1); }
      if (last != lastPrefix) {
        filterSuggestions(last, $(this));
        selectedIdx = -1;
        lastPrefix = last;
      }
    } else {
      $("#suggestions").css({'display': 'none'});
    }
  });

  $(document).on("keydown", ".tag_field", function(e) {
    switch (e.keyCode) {
    case 40: // up
      suggestionsSelect(1);
      e.preventDefault();
      break;
    case 38: // down
      suggestionsSelect(-1);
      e.preventDefault();
      break;
    case 27: // esc
      e.preventDefault();
      $("#suggestions").css({'display': 'none'});
      break;
    case 13: // enter
      if ($("#suggestions").css("display") != "none") {
        e.preventDefault();
        // LOL
        completeWithSuggestedTag($("#suggestions").children().eq(selectedIdx).find("a").text(),
                                 $(document.activeElement));
        $("#suggestions").css({'display': 'none'});
      }
      break;
    default:
      break;
    }
  });

  function suggestionsSelect(direction) {
    let list = $("#suggestions");
    list.children().eq(selectedIdx).removeClass("selected");
    selectedIdx += direction;
    list.children().eq(selectedIdx).addClass("selected");
  }

  $(document).on("mousedown", "#suggestions", function(e) {
    // prevents input from blurring when clicking suggestions
    e.preventDefault();
  });

  $(document).on("focusout", ".tag_field", function(e) {
    $("#suggestions").css({'display': 'none'});
  });
});
