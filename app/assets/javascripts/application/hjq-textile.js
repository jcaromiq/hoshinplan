/* textile-editor */
(function ($) {
    var methods = {
        init: function (annotations) {
            var options = this.hjq('getOptions', annotations);
            if (!options.no_toolbar) {
                new MyTextileEditor($(this).attr('id'), 'extended');
                if ($(this).is(":hidden")) {
                    $(this).prev(".textile-toolbar").hide();
                    $(this).focus(function () {
                        $(this).prev(".textile-toolbar").show();
                    });
                }
            }
            var that = $(this);
            that.one('focus.autoExpand', function(){
                    var savedValue = this.value;
                    this.value = '';
                    this.baseScrollHeight = this.scrollHeight;
                    this.value = savedValue;
                })
                .on('input.autoExpand focus.autoExpand', function(){
                    var minRows = this.getAttribute('data-min-rows')|0, rows;
                    var maxRows = this.getAttribute('data-max-rows')|20, rows;
                    this.rows = minRows;
                    rows = Math.ceil((this.scrollHeight - this.baseScrollHeight) / 17);
                    rows = rows > maxRows ? maxRows : rows;
                    this.rows = minRows + rows;
                });
            var cid = that.closest("form[data-company]").data("company");
            var csrf = $("meta[name=csrf-token]").attr("content");
            var users = null;

            if (!cid) {
                cid = $(document).hjq('pageData')["company-id"];
            }

            that.textcomplete([{
                match: /\B([:@][\-+\w]*)$/,

                search: function (termWithStart, callback) {
                    var start = termWithStart.charAt(0);
                    var term = termWithStart.substr(1);
                    var results = [];
                    var results2 = [];
                    var results3 = [];

                    if (start === '@') {
                        if (users == null) {
                            $.ajax({
                                beforeSend: function (request) {
                                    request.setRequestHeader("X-CSRF-Token", csrf);
                                    request.setRequestHeader("Accept", '*/*');
                                },
                                dataType: "json",
                                url: '/companies/complete_users2',
                                data: {id: cid, term: term}
                            }).done(function (resp) {
                                users = resp;
                                $.each(users, function (id, name) {
                                    if (name.indexOf(term) > -1) {
                                        results.push({id: id, name: name});
                                    }
                                });
                                callback(results);
                            }).fail(function (resp) {
                                callback([]);
                            });
                        } else {
                            $.each(users, function (id, name) {
                                if (name.indexOf(term) > -1) {
                                    results.push({id: id, name: name});
                                }
                            });
                            callback(results);
                        }
                    } else {
                        $.each(emojiStrategy, function (shortname, data) {
                            if (shortname.indexOf(term) > -1) {
                                results.push(shortname);
                            }
                            else {
                                if (data.aliases && (data.aliases.indexOf(term) > -1)) {
                                    results2.push(shortname);
                                }
                                else if (data.keywords && (data.keywords.indexOf(term) > -1)) {
                                    results3.push(shortname);
                                }
                            }
                        });

                        if (term.length >= 3) {
                            results.sort(function (a, b) {
                                return (a.length > b.length);
                            });
                            results2.sort(function (a, b) {
                                return (a.length > b.length);
                            });
                            results3.sort();
                        }
                        var newResults = results.concat(results2).concat(results3);

                        callback(newResults);
                    }
                },
                template: function (shortname) {
                    if (typeof shortname === "object") {
                        return shortname.name;
                    } else {
                        return '<img class="emojione" src="https://d4i78hkg1rdv3.cloudfront.net/assets/emoji/unicode/' + emojiStrategy[shortname].unicode.toLowerCase() + '.png"> :' + shortname + ':';
                    }
                },
                replace: function (shortname) {
                    if (typeof shortname === "object") {
                        return '@' + shortname.id + ': ';
                    } else {
                        return ':' + shortname + ': ';
                    }
                },
                index: 1,
                maxCount: 10
            }
            ], {
                'zIndex': '2000', 'className': 'textcomplete-dropdown'
            });
        }
    };

    $.fn.hjq_textile_editor = function (method) {

        if (methods[method]) {
            return methods[method].apply(this, Array.prototype.slice.call(arguments, 1));
        } else if (typeof method === 'object' || !method) {
            return methods.init.apply(this, arguments);
        } else {
            $.error('Method ' + method + ' does not exist on hjq_textile_editor');
        }
    };

    var oldSetPosition = $.fn.textcomplete.Dropdown.prototype.setPosition;
    $.fn.textcomplete.Dropdown.prototype.setPosition = function (position) {
        oldSetPosition.call(this, position);
        this.$el.css('position', 'absolute');
    };

    $.fn.textcomplete.Dropdown.prototype.isEscape = function (e) {
        return e.keyCode === 27;  // ESCAPE
    };

    var oldOnKeyDown = $.fn.textcomplete.Dropdown.prototype._onKeydown;

    $.fn.textcomplete.Dropdown.prototype._onKeydown = function (e) {
        if (!this.shown) {
            return;
        }
        if (this.isEscape(e)) {
            e.stopPropagation();
            e.preventDefault();
            this.deactivate();
        } else {
            oldOnKeyDown.call(this, e);
        }
    };

})(jQuery);

var emojiStrategy = {
    "100": {
        "unicode": "1F4AF",
        "shortname": ":100:",
        "aliases": "",
        "keywords": "hundred points symbol numbers perfect score 100 percent a plus perfect school quiz score test exam"
    },
    "1234": {
        "unicode": "1F522",
        "shortname": ":1234:",
        "aliases": "",
        "keywords": "input symbol for numbers blue-square numbers"
    },
    "hearts": {"unicode": "2665", "shortname": ":hearts:", "aliases": "", "keywords": "black heart suit cards poker"},
    "joy": {
        "unicode": "1F602",
        "shortname": ":joy:",
        "aliases": "",
        "keywords": "face with tears of joy cry face haha happy tears tears cry joy happy weep"
    },
    "unamused": {
        "unicode": "1F612",
        "shortname": ":unamused:",
        "aliases": "",
        "keywords": "unamused face bored face indifference serious straight face unamused not amused depressed unhappy disapprove lame"
    },
    "heart_eyes": {
        "unicode": "1F60D",
        "shortname": ":heart_eyes:",
        "aliases": "",
        "keywords": "smiling face with heart-shaped eyes affection crush face infatuation like love valentines smiling heart lovestruck love flirt smile heart-shaped"
    },
    "heart": {
        "unicode": "2764",
        "shortname": ":heart:",
        "aliases": "",
        "keywords": "heavy black heart like love red pink black heart love passion romance intense desire death evil cold valentines"
    },
    "relaxed": {
        "unicode": "263A",
        "shortname": ":relaxed:",
        "aliases": "",
        "keywords": "white smiling face blush face happiness massage smile"
    },
    "ok_hand": {
        "unicode": "1F44C",
        "shortname": ":ok_hand:",
        "aliases": "",
        "keywords": "ok hand sign fingers limbs perfect okay ok smoke smoking marijuana joint pot 420"
    },
    "kissing_heart": {
        "unicode": "1F618",
        "shortname": ":kissing_heart:",
        "aliases": "",
        "keywords": "face throwing a kiss affection face infatuation kiss blowing kiss heart love lips like love valentines"
    },
    "blush": {
        "unicode": "1F60A",
        "shortname": ":blush:",
        "aliases": "",
        "keywords": "smiling face with smiling eyes crush embarrassed face flushed happy shy smile smiling smile smiley"
    },
    "weary": {
        "unicode": "1F629",
        "shortname": ":weary:",
        "aliases": "",
        "keywords": "weary face face frustrated sad sleepy tired weary sleepy tired tiredness study finals school exhausted"
    },
    "pensive": {
        "unicode": "1F614",
        "shortname": ":pensive:",
        "aliases": "",
        "keywords": "pensive face face okay sad pensive thoughtful think reflective wistful meditate serious"
    },
    "sob": {
        "unicode": "1F62D",
        "shortname": ":sob:",
        "aliases": "",
        "keywords": "loudly crying face cry face sad tears upset cry sob tears sad melancholy morn somber hurt"
    },
    "smirk": {
        "unicode": "1F60F",
        "shortname": ":smirk:",
        "aliases": "",
        "keywords": "smirking face mean prank smile smug smirking smirk smug smile half-smile conceited"
    },
    "two_hearts": {
        "unicode": "1F495",
        "shortname": ":two_hearts:",
        "aliases": "",
        "keywords": "two hearts affection like love valentines heart hearts two love emotion"
    },
    "grin": {
        "unicode": "1F601",
        "shortname": ":grin:",
        "aliases": "",
        "keywords": "grinning face with smiling eyes face happy joy smile grin grinning smiling smile smiley"
    },
    "flushed": {
        "unicode": "1F633",
        "shortname": ":flushed:",
        "aliases": "",
        "keywords": "flushed face blush face flattered flush blush red pink cheeks shy"
    },
    "thumbsup": {
        "unicode": "1F44D",
        "shortname": ":thumbsup:",
        "aliases": ":+1:",
        "keywords": "thumbs up sign cool hand like yes"
    },
    "raised_hands": {
        "unicode": "1F64C",
        "shortname": ":raised_hands:",
        "aliases": "",
        "keywords": "person raising both hands in celebration gesture hooray winning woot yay banzai"
    },
    "wink": {
        "unicode": "1F609",
        "shortname": ":wink:",
        "aliases": "",
        "keywords": "winking face face happy mischievous secret wink winking friendly joke"
    },
    "information_desk_person": {
        "unicode": "1F481",
        "shortname": ":information_desk_person:",
        "aliases": "",
        "keywords": "information desk person female girl human woman information help question answer sassy unimpressed attitude snarky"
    },
    "relieved": {
        "unicode": "1F60C",
        "shortname": ":relieved:",
        "aliases": "",
        "keywords": "relieved face face happiness massage phew relaxed relieved satisfied phew relief"
    },
    "see_no_evil": {
        "unicode": "1F648",
        "shortname": ":see_no_evil:",
        "aliases": "",
        "keywords": "see-no-evil monkey animal monkey nature monkey see eyes vision sight mizaru"
    },
    "v": {
        "unicode": "270C",
        "shortname": ":v:",
        "aliases": "",
        "keywords": "victory hand fingers hand ohyeah peace two victory"
    },
    "pray": {
        "unicode": "1F64F",
        "shortname": ":pray:",
        "aliases": "",
        "keywords": "person with folded hands highfive hope namaste please wish pray high five hands sorrow regret sorry"
    },
    "yum": {
        "unicode": "1F60B",
        "shortname": ":yum:",
        "aliases": "",
        "keywords": "face savouring delicious food face happy joy smile tongue delicious savoring food eat yummy yum tasty savory"
    },
    "stuck_out_tongue_winking_eye": {
        "unicode": "1F61C",
        "shortname": ":stuck_out_tongue_winking_eye:",
        "aliases": "",
        "keywords": "face with stuck-out tongue and winking eye childish face mischievous playful prank tongue wink winking kidding silly playful crazy"
    },
    "notes": {
        "unicode": "1F3B6",
        "shortname": ":notes:",
        "aliases": "",
        "keywords": "multiple musical notes music score musical music notes music sound melody"
    },
    "eyes": {"unicode": "1F440", "shortname": ":eyes:", "aliases": "", "keywords": "eyes look peek stalk watch"},
    "smile": {
        "unicode": "1F604",
        "shortname": ":smile:",
        "aliases": "",
        "keywords": "smiling face with open mouth and smiling eyes face funny haha happy joy laugh smile smiley smiling"
    },
    "disappointed": {
        "unicode": "1F61E",
        "shortname": ":disappointed:",
        "aliases": "",
        "keywords": "disappointed face disappointed disappoint frown depressed discouraged face sad upset"
    },
    "raised_hand": {
        "unicode": "270B",
        "shortname": ":raised_hand:",
        "aliases": "",
        "keywords": "raised hand female girl woman"
    },
    "clap": {
        "unicode": "1F44F",
        "shortname": ":clap:",
        "aliases": "",
        "keywords": "clapping hands sign applause congrats hands praise clapping appreciation approval sound encouragement enthusiasm"
    },
    "speak_no_evil": {
        "unicode": "1F64A",
        "shortname": ":speak_no_evil:",
        "aliases": "",
        "keywords": "speak-no-evil monkey animal monkey monkey mouth talk say words verbal verbalize oral iwazaru"
    },
    "cry": {
        "unicode": "1F622",
        "shortname": ":cry:",
        "aliases": "",
        "keywords": "crying face face sad sad cry tear weep tears"
    },
    "rage": {
        "unicode": "1F621",
        "shortname": ":rage:",
        "aliases": "",
        "keywords": "pouting face angry despise hate mad pout anger rage irate"
    },
    "tired_face": {
        "unicode": "1F62B",
        "shortname": ":tired_face:",
        "aliases": "",
        "keywords": "tired face face frustrated sick upset whine exhausted sleepy tired"
    },
    "scream": {
        "unicode": "1F631",
        "shortname": ":scream:",
        "aliases": "",
        "keywords": "face screaming in fear face munch scream painting artist alien"
    },
    "purple_heart": {
        "unicode": "1F49C",
        "shortname": ":purple_heart:",
        "aliases": "",
        "keywords": "purple heart affection like love valentines purple violet heart love sensitive understanding compassionate compassion duty honor royalty veteran sacrifice"
    },
    "broken_heart": {
        "unicode": "1F494",
        "shortname": ":broken_heart:",
        "aliases": "",
        "keywords": "broken heart sad sorry"
    },
    "kiss": {
        "unicode": "1F48B",
        "shortname": ":kiss:",
        "aliases": "",
        "keywords": "kiss mark affection face like lips love valentines"
    },
    "blue_heart": {
        "unicode": "1F499",
        "shortname": ":blue_heart:",
        "aliases": "",
        "keywords": "blue heart affection like love valentines blue heart love stability truth loyalty trust"
    },
    "sleepy": {
        "unicode": "1F62A",
        "shortname": ":sleepy:",
        "aliases": "",
        "keywords": "sleepy face face rest tired sleepy tired exhausted"
    },
    "sweat_smile": {
        "unicode": "1F605",
        "shortname": ":sweat_smile:",
        "aliases": "",
        "keywords": "smiling face with open mouth and cold sweat face happy hot smiling cold sweat perspiration"
    },
    "stuck_out_tongue_closed_eyes": {
        "unicode": "1F61D",
        "shortname": ":stuck_out_tongue_closed_eyes:",
        "aliases": "",
        "keywords": "face with stuck-out tongue and tightly-closed eyes face mischievous playful prank tongue kidding silly playful ecstatic"
    },
    "punch": {"unicode": "1F44A", "shortname": ":punch:", "aliases": "", "keywords": "fisted hand sign fist hand"},
    "triumph": {
        "unicode": "1F624",
        "shortname": ":triumph:",
        "aliases": "",
        "keywords": "face with look of triumph face gas phew triumph steam breath"
    },
    "sparkling_heart": {
        "unicode": "1F496",
        "shortname": ":sparkling_heart:",
        "aliases": "",
        "keywords": "sparkling heart affection like love valentines"
    },
    "smiley": {
        "unicode": "1F603",
        "shortname": ":smiley:",
        "aliases": "",
        "keywords": "smiling face with open mouth face haha happy joy smiling smile smiley"
    },
    "sunny": {
        "unicode": "2600",
        "shortname": ":sunny:",
        "aliases": "",
        "keywords": "black sun with rays brightness weather"
    },
    "heartpulse": {
        "unicode": "1F497",
        "shortname": ":heartpulse:",
        "aliases": "",
        "keywords": "growing heart affection like love valentines"
    },
    "wave": {
        "unicode": "1F44B",
        "shortname": ":wave:",
        "aliases": "",
        "keywords": "waving hand sign farewell gesture goodbye hands solong"
    },
    "mask": {
        "unicode": "1F637",
        "shortname": ":mask:",
        "aliases": "",
        "keywords": "face with medical mask face ill sick sick virus flu medical mask"
    },
    "heavy_check_mark": {
        "unicode": "2714",
        "shortname": ":heavy_check_mark:",
        "aliases": "",
        "keywords": "heavy check mark nike ok"
    },
    "cherry_blossom": {
        "unicode": "1F338",
        "shortname": ":cherry_blossom:",
        "aliases": "",
        "keywords": "cherry blossom flower nature plant cherry blossom tree flower"
    },
    "rose": {
        "unicode": "1F339",
        "shortname": ":rose:",
        "aliases": "",
        "keywords": "rose flowers love valentines rose fragrant flower thorns love petals romance"
    },
    "persevere": {
        "unicode": "1F623",
        "shortname": ":persevere:",
        "aliases": "",
        "keywords": "persevering face endure persevere face no sick upset"
    },
    "revolving_hearts": {
        "unicode": "1F49E",
        "shortname": ":revolving_hearts:",
        "aliases": "",
        "keywords": "revolving hearts affection like love valentines heart hearts revolving moving circle multiple lovers"
    },
    "sparkles": {
        "unicode": "2728",
        "shortname": ":sparkles:",
        "aliases": "",
        "keywords": "sparkles cool shine shiny stars"
    },
    "confounded": {
        "unicode": "1F616",
        "shortname": ":confounded:",
        "aliases": "",
        "keywords": "confounded face confused face sick unwell confound amaze perplex puzzle mystify"
    },
    "tada": {
        "unicode": "1F389",
        "shortname": ":tada:",
        "aliases": "",
        "keywords": "party popper contulations party party popper tada celebration victory announcement climax congratulations"
    },
    "no_good": {
        "unicode": "1F645",
        "shortname": ":no_good:",
        "aliases": "",
        "keywords": "face with no good gesture female girl woman no stop nope don't not"
    },
    "muscle": {
        "unicode": "1F4AA",
        "shortname": ":muscle:",
        "aliases": "",
        "keywords": "flexed biceps arm flex hand strong muscle bicep"
    },
    "angry": {
        "unicode": "1F620",
        "shortname": ":angry:",
        "aliases": "",
        "keywords": "angry face angry livid mad vexed irritated annoyed face frustrated mad"
    },
    "gun": {"unicode": "1F52B", "shortname": ":gun:", "aliases": "", "keywords": "pistol violence weapon"},
    "cupid": {
        "unicode": "1F498",
        "shortname": ":cupid:",
        "aliases": "",
        "keywords": "heart with arrow affection heart like love valentines"
    },
    "sweat": {
        "unicode": "1F613",
        "shortname": ":sweat:",
        "aliases": "",
        "keywords": "face with cold sweat cold sweat sick anxious worried clammy diaphoresis face hot"
    },
    "laughing": {
        "unicode": "1F606",
        "shortname": ":laughing:",
        "aliases": ":satisfied:",
        "keywords": "smiling face with open mouth and tightly-closed ey happy joy lol smiling laughing laugh"
    },
    "yellow_heart": {
        "unicode": "1F49B",
        "shortname": ":yellow_heart:",
        "aliases": "",
        "keywords": "yellow heart affection like love valentines yellow gold heart love friendship happy happiness trust compassionate respectful honest caring selfless"
    },
    "kissing_closed_eyes": {
        "unicode": "1F61A",
        "shortname": ":kissing_closed_eyes:",
        "aliases": "",
        "keywords": "kissing face with closed eyes affection face infatuation like love valentines kissing kiss passion puckered heart love smooch"
    },
    "disappointed_relieved": {
        "unicode": "1F625",
        "shortname": ":disappointed_relieved:",
        "aliases": "",
        "keywords": "disappointed but relieved face face nervous phew sweat disappoint relief"
    },
    "raising_hand": {
        "unicode": "1F64B",
        "shortname": ":raising_hand:",
        "aliases": "",
        "keywords": "happy person raising one hand female girl woman hand raise notice attention answer"
    },
    "fist": {"unicode": "270A", "shortname": ":fist:", "aliases": "", "keywords": "raised fist fingers grasp hand"},
    "green_heart": {
        "unicode": "1F49A",
        "shortname": ":green_heart:",
        "aliases": "",
        "keywords": "green heart affection like love valentines green heart love nature rebirth reborn jealous clingy envious possessive"
    },
    "headphones": {
        "unicode": "1F3A7",
        "shortname": ":headphones:",
        "aliases": "",
        "keywords": "headphone gadgets music score headphone sound music ears beats buds audio listen"
    },
    "thumbsdown": {
        "unicode": "1F44E",
        "shortname": ":thumbsdown:",
        "aliases": ":-1:",
        "keywords": "thumbs down sign hand no"
    },
    "heart_eyes_cat": {
        "unicode": "1F63B",
        "shortname": ":heart_eyes_cat:",
        "aliases": "",
        "keywords": "smiling cat face with heart-shaped eyes affection animal cats like love valentines lovestruck love heart"
    },
    "dancer": {
        "unicode": "1F483",
        "shortname": ":dancer:",
        "aliases": "",
        "keywords": "dancer female fun girl woman dance dancer dress fancy boogy party celebrate ballet tango cha cha music"
    },
    "skull": {
        "unicode": "1F480",
        "shortname": ":skull:",
        "aliases": ":skeleton:",
        "keywords": "skull dead skeleton dying"
    },
    "poop": {
        "unicode": "1F4A9",
        "shortname": ":poop:",
        "aliases": ":shit: :hankey: :poo:",
        "keywords": "pile of poo poop shit shitface turd poo"
    },
    "fire": {"unicode": "1F525", "shortname": ":fire:", "aliases": ":flame:", "keywords": "fire cook hot flame"},
    "walking": {
        "unicode": "1F6B6",
        "shortname": ":walking:",
        "aliases": "",
        "keywords": "pedestrian human man walk pedestrian stroll stride foot feet"
    },
    "cold_sweat": {
        "unicode": "1F630",
        "shortname": ":cold_sweat:",
        "aliases": "",
        "keywords": "face with open mouth and cold sweat face nervous sweat exasperated frustrated"
    },
    "copyright": {
        "unicode": "00A9",
        "shortname": ":copyright:",
        "aliases": "",
        "keywords": "copyright sign ip license"
    },
    "penguin": {"unicode": "1F427", "shortname": ":penguin:", "aliases": "", "keywords": "penguin animal nature"},
    "crown": {"unicode": "1F451", "shortname": ":crown:", "aliases": "", "keywords": "crown king kod leader royalty"},
    "open_hands": {
        "unicode": "1F450",
        "shortname": ":open_hands:",
        "aliases": "",
        "keywords": "open hands sign butterfly fingers"
    },
    "point_right": {
        "unicode": "1F449",
        "shortname": ":point_right:",
        "aliases": "",
        "keywords": "white right pointing backhand index direction fingers hand"
    },
    "heartbeat": {
        "unicode": "1F493",
        "shortname": ":heartbeat:",
        "aliases": "",
        "keywords": "beating heart affection like love valentines"
    },
    "dancers": {
        "unicode": "1F46F",
        "shortname": ":dancers:",
        "aliases": "",
        "keywords": "woman with bunny ears bunny female girls women dancing dancers showgirl playboy costume bunny cancan"
    },
    "ok_woman": {
        "unicode": "1F646",
        "shortname": ":ok_woman:",
        "aliases": "",
        "keywords": "face with ok gesture female girl human pink women yes ok okay accept"
    },
    "pizza": {
        "unicode": "1F355",
        "shortname": ":pizza:",
        "aliases": "",
        "keywords": "slice of pizza food party pizza pie new york italian italy slice peperoni"
    },
    "ballot_box_with_check": {
        "unicode": "2611",
        "shortname": ":ballot_box_with_check:",
        "aliases": "",
        "keywords": "ballot box with check agree ok"
    },
    "zzz": {"unicode": "1F4A4", "shortname": ":zzz:", "aliases": "", "keywords": "sleeping symbol sleepy tired"},
    "point_left": {
        "unicode": "1F448",
        "shortname": ":point_left:",
        "aliases": "",
        "keywords": "white left pointing backhand index direction fingers hand"
    },
    "musical_note": {
        "unicode": "1F3B5",
        "shortname": ":musical_note:",
        "aliases": "",
        "keywords": "musical note score musical music note music sound"
    },
    "bow": {
        "unicode": "1F647",
        "shortname": ":bow:",
        "aliases": "",
        "keywords": "person bowing deeply boy male man sorry bow respect curtsy bend"
    },
    "fearful": {
        "unicode": "1F628",
        "shortname": ":fearful:",
        "aliases": "",
        "keywords": "fearful face face nervous oops scared terrified fear fearful scared frightened"
    },
    "ribbon": {
        "unicode": "1F380",
        "shortname": ":ribbon:",
        "aliases": "",
        "keywords": "ribbon bowtie decoration girl pink ribbon lace wrap decorate"
    },
    "joy_cat": {
        "unicode": "1F639",
        "shortname": ":joy_cat:",
        "aliases": "",
        "keywords": "cat face with tears of joy animal cats haha happy tears happy tears cry joy"
    },
    "arrow_forward": {
        "unicode": "25B6",
        "shortname": ":arrow_forward:",
        "aliases": "",
        "keywords": "black right-pointing triangle arrow blue-square"
    },
    "tongue": {
        "unicode": "1F445",
        "shortname": ":tongue:",
        "aliases": "",
        "keywords": "tongue mouth playful tongue mouth taste buds food silly playful tease kiss french kiss lick tasty playfulness silliness intimacy"
    },
    "runner": {
        "unicode": "1F3C3",
        "shortname": ":runner:",
        "aliases": "",
        "keywords": "runner exercise man walking run runner jog exercise sprint race dash"
    },
    "point_up": {
        "unicode": "261D",
        "shortname": ":point_up:",
        "aliases": "",
        "keywords": "white up pointing index direction fingers hand"
    },
    "airplane": {
        "unicode": "2708",
        "shortname": ":airplane:",
        "aliases": "",
        "keywords": "airplane flight transportation vehicle airplane plane airport travel airlines fly jet jumbo boeing airbus"
    },
    "gem": {"unicode": "1F48E", "shortname": ":gem:", "aliases": "", "keywords": "gem stone blue ruby"},
    "person_frowning": {
        "unicode": "1F64D",
        "shortname": ":person_frowning:",
        "aliases": "",
        "keywords": "person frowning female girl woman dejected rejected sad frown"
    },
    "hibiscus": {
        "unicode": "1F33A",
        "shortname": ":hibiscus:",
        "aliases": "",
        "keywords": "hibiscus flowers plant vegetable hibiscus flower warm"
    },
    "basketball": {
        "unicode": "1F3C0",
        "shortname": ":basketball:",
        "aliases": "",
        "keywords": "basketball and hoop NBA balls sports basketball bball dribble hoop net swish rip city"
    },
    "boom": {
        "unicode": "1F4A5",
        "shortname": ":boom:",
        "aliases": "",
        "keywords": "collision symbol bomb explode explosion boom bang collision fire emphasis wow bam"
    },
    "nail_care": {
        "unicode": "1F485",
        "shortname": ":nail_care:",
        "aliases": "",
        "keywords": "nail polish beauty manicure"
    },
    "dizzy_face": {
        "unicode": "1F635",
        "shortname": ":dizzy_face:",
        "aliases": "",
        "keywords": "dizzy face dizzy drunk inebriated face spent unconscious xox"
    },
    "balloon": {
        "unicode": "1F388",
        "shortname": ":balloon:",
        "aliases": "",
        "keywords": "balloon celebration party balloon birthday celebration helium gas children float"
    },
    "couple": {
        "unicode": "1F46B",
        "shortname": ":couple:",
        "aliases": "",
        "keywords": "man and woman holding hands affection date dating human like love marriage people valentines"
    },
    "dog": {"unicode": "1F436", "shortname": ":dog:", "aliases": "", "keywords": "dog face animal friend nature woof"},
    "sweat_drops": {
        "unicode": "1F4A6",
        "shortname": ":sweat_drops:",
        "aliases": "",
        "keywords": "splashing sweat symbol water"
    },
    "star2": {
        "unicode": "1F31F",
        "shortname": ":star2:",
        "aliases": "",
        "keywords": "glowing star night sparkle glow glowing star five points classic"
    },
    "hear_no_evil": {
        "unicode": "1F649",
        "shortname": ":hear_no_evil:",
        "aliases": "",
        "keywords": "hear-no-evil monkey animal monkey monkey ears hear sound kikazaru"
    },
    "moneybag": {
        "unicode": "1F4B0",
        "shortname": ":moneybag:",
        "aliases": "",
        "keywords": "money bag coins dollar payment"
    },
    "beers": {
        "unicode": "1F37B",
        "shortname": ":beers:",
        "aliases": "",
        "keywords": "clinking beer mugs beverage drink drunk party pub relax beer beers cheers mug toast celebrate pub bar jolly hops clink"
    },
    "couplekiss": {
        "unicode": "1F48F",
        "shortname": ":couplekiss:",
        "aliases": "",
        "keywords": "kiss dating like love marriage valentines"
    },
    "point_down": {
        "unicode": "1F447",
        "shortname": ":point_down:",
        "aliases": "",
        "keywords": "white down pointing backhand index direction fingers hand"
    },
    "cloud": {"unicode": "2601", "shortname": ":cloud:", "aliases": "", "keywords": "cloud sky weather"},
    "alien": {
        "unicode": "1F47D",
        "shortname": ":alien:",
        "aliases": "",
        "keywords": "extraterrestrial alien UFO paul alien ufo"
    },
    "dizzy": {
        "unicode": "1F4AB",
        "shortname": ":dizzy:",
        "aliases": "",
        "keywords": "dizzy symbol shoot sparkle star dizzy drunk sick intoxicated squeans starburst star"
    },
    "heavy_multiplication_x": {
        "unicode": "2716",
        "shortname": ":heavy_multiplication_x:",
        "aliases": "",
        "keywords": "heavy multiplication x calculation math"
    },
    "white_check_mark": {
        "unicode": "2705",
        "shortname": ":white_check_mark:",
        "aliases": "",
        "keywords": "white heavy check mark agree green-square ok"
    },
    "palm_tree": {
        "unicode": "1F334",
        "shortname": ":palm_tree:",
        "aliases": "",
        "keywords": "palm tree nature plant vegetable palm tree coconuts fronds warm tropical"
    },
    "dash": {"unicode": "1F4A8", "shortname": ":dash:", "aliases": "", "keywords": "dash symbol air fast shoo wind"},
    "exclamation": {
        "unicode": "2757",
        "shortname": ":exclamation:",
        "aliases": "",
        "keywords": "heavy exclamation mark symbol surprise"
    },
    "soccer": {
        "unicode": "26BD",
        "shortname": ":soccer:",
        "aliases": "",
        "keywords": "soccer ball balls fifa football sports european football"
    },
    "microphone": {
        "unicode": "1F3A4",
        "shortname": ":microphone:",
        "aliases": "",
        "keywords": "microphone PA music sound microphone mic audio sound voice karaoke"
    },
    "angel": {
        "unicode": "1F47C",
        "shortname": ":angel:",
        "aliases": "",
        "keywords": "baby angel baby angel halo cupid wings halo heaven wings jesus"
    },
    "point_up_2": {
        "unicode": "1F446",
        "shortname": ":point_up_2:",
        "aliases": "",
        "keywords": "white up pointing backhand index direction fingers hand"
    },
    "snowflake": {
        "unicode": "2744",
        "shortname": ":snowflake:",
        "aliases": "",
        "keywords": "snowflake christmas cold season weather winter xmas snowflake snow frozen droplet ice crystal cold chilly winter unique special below zero elsa"
    },
    "astonished": {
        "unicode": "1F632",
        "shortname": ":astonished:",
        "aliases": "",
        "keywords": "astonished face face xox shocked surprise astonished"
    },
    "four_leaf_clover": {
        "unicode": "1F340",
        "shortname": ":four_leaf_clover:",
        "aliases": "",
        "keywords": "four leaf clover lucky nature plant vegetable clover four leaf luck irish saint patrick green"
    },
    "ghost": {"unicode": "1F47B", "shortname": ":ghost:", "aliases": "", "keywords": "ghost halloween"},
    "princess": {
        "unicode": "1F478",
        "shortname": ":princess:",
        "aliases": "",
        "keywords": "princess blond crown female girl woman princess royal royalty king queen daughter disney high-maintenance"
    },
    "cat": {"unicode": "1F431", "shortname": ":cat:", "aliases": "", "keywords": "cat face animal meow"},
    "ring": {
        "unicode": "1F48D",
        "shortname": ":ring:",
        "aliases": "",
        "keywords": "ring marriage propose valentines wedding"
    },
    "sunflower": {
        "unicode": "1F33B",
        "shortname": ":sunflower:",
        "aliases": "",
        "keywords": "sunflower nature plant sunflower sun flower seeds yellow"
    },
    "o": {"unicode": "2B55", "shortname": ":o:", "aliases": "", "keywords": "heavy large circle circle round"},
    "crescent_moon": {
        "unicode": "1F319",
        "shortname": ":crescent_moon:",
        "aliases": "",
        "keywords": "crescent moon night moon crescent waxing sky night cheese phase"
    },
    "gift": {
        "unicode": "1F381",
        "shortname": ":gift:",
        "aliases": "",
        "keywords": "wrapped present birthday christmas present xmas gift present wrap package birthday wedding"
    },
    "crying_cat_face": {
        "unicode": "1F63F",
        "shortname": ":crying_cat_face:",
        "aliases": "",
        "keywords": "crying cat face animal cats sad tears weep cry cat sob tears sad melancholy morn somber hurt"
    },
    "bouquet": {"unicode": "1F490", "shortname": ":bouquet:", "aliases": "", "keywords": "bouquet flowers nature"},
    "star": {"unicode": "2B50", "shortname": ":star:", "aliases": "", "keywords": "white medium star night yellow"},
    "leaves": {
        "unicode": "1F343",
        "shortname": ":leaves:",
        "aliases": "",
        "keywords": "leaf fluttering in wind grass lawn nature plant tree vegetable leaves leaf wind float fluttering"
    },
    "cactus": {
        "unicode": "1F335",
        "shortname": ":cactus:",
        "aliases": "",
        "keywords": "cactus nature plant vegetable cactus desert drought spike poke"
    },
    "clubs": {"unicode": "2663", "shortname": ":clubs:", "aliases": "", "keywords": "black club suit cards poker"},
    "diamonds": {
        "unicode": "2666",
        "shortname": ":diamonds:",
        "aliases": "",
        "keywords": "black diamond suit cards poker"
    },
    "massage": {
        "unicode": "1F486",
        "shortname": ":massage:",
        "aliases": "",
        "keywords": "face massage female girl woman"
    },
    "imp": {
        "unicode": "1F47F",
        "shortname": ":imp:",
        "aliases": "",
        "keywords": "imp angry devil evil horns cute devil"
    },
    "red_circle": {
        "unicode": "1F534",
        "shortname": ":red_circle:",
        "aliases": "",
        "keywords": "large red circle shape"
    },
    "money_with_wings": {
        "unicode": "1F4B8",
        "shortname": ":money_with_wings:",
        "aliases": "",
        "keywords": "money with wings bills dollar payment money wings easy spend work lost blown burned gift cash dollar"
    },
    "football": {
        "unicode": "1F3C8",
        "shortname": ":football:",
        "aliases": "",
        "keywords": "american football NFL balls sports football ball sport america american"
    },
    "cyclone": {
        "unicode": "1F300",
        "shortname": ":cyclone:",
        "aliases": "",
        "keywords": "cyclone blue cloud swirl weather cyclone hurricane typhoon storm ocean"
    },
    "smirk_cat": {
        "unicode": "1F63C",
        "shortname": ":smirk_cat:",
        "aliases": "",
        "keywords": "cat face with wry smile animal cats smirk smirking wry confident confidence"
    },
    "snowman": {
        "unicode": "26C4",
        "shortname": ":snowman:",
        "aliases": "",
        "keywords": "snowman without snow christmas cold season weather winter xmas"
    },
    "birthday": {
        "unicode": "1F382",
        "shortname": ":birthday:",
        "aliases": "",
        "keywords": "birthday cake cake party birthday birth cake dessert wish celebrate"
    },
    "baby": {"unicode": "1F476", "shortname": ":baby:", "aliases": "", "keywords": "baby boy child infant"},
    "telephone": {
        "unicode": "260E",
        "shortname": ":telephone:",
        "aliases": "",
        "keywords": "black telephone communication dial technology"
    },
    "eggplant": {
        "unicode": "1F346",
        "shortname": ":eggplant:",
        "aliases": "",
        "keywords": "aubergine aubergine food nature vegetable eggplant aubergine fruit purple penis"
    },
    "gift_heart": {
        "unicode": "1F49D",
        "shortname": ":gift_heart:",
        "aliases": "",
        "keywords": "heart with ribbon love valentines"
    },
    "tulip": {
        "unicode": "1F337",
        "shortname": ":tulip:",
        "aliases": "",
        "keywords": "tulip flowers nature plant tulip flower bulb spring easter"
    },
    "confetti_ball": {
        "unicode": "1F38A",
        "shortname": ":confetti_ball:",
        "aliases": "",
        "keywords": "confetti ball festival party party congratulations confetti ball celebrate win birthday new years wedding"
    },
    "black_small_square": {
        "unicode": "25AA",
        "shortname": ":black_small_square:",
        "aliases": "",
        "keywords": "black small square "
    },
    "coffee": {
        "unicode": "2615",
        "shortname": ":coffee:",
        "aliases": "",
        "keywords": "hot beverage beverage cafe drink espresso"
    },
    "scream_cat": {
        "unicode": "1F640",
        "shortname": ":scream_cat:",
        "aliases": "",
        "keywords": "weary cat face animal cats munch weary sleepy tired tiredness study finals school exhausted scream painting artist"
    },
    "rocket": {
        "unicode": "1F680",
        "shortname": ":rocket:",
        "aliases": "",
        "keywords": "rocket launch ship staffmode rocket space spacecraft astronaut cosmonaut"
    },
    "christmas_tree": {
        "unicode": "1F384",
        "shortname": ":christmas_tree:",
        "aliases": "",
        "keywords": "christmas tree celebration december festival vacation xmas christmas xmas santa holiday winter december santa evergreen ornaments jesus gifts presents"
    },
    "x": {"unicode": "274C", "shortname": ":x:", "aliases": "", "keywords": "cross mark delete no remove"},
    "knife": {"unicode": "1F52A", "shortname": ":knife:", "aliases": "", "keywords": "hocho "},
    "bangbang": {
        "unicode": "203C",
        "shortname": ":bangbang:",
        "aliases": "",
        "keywords": "double exclamation mark exclamation surprise"
    },
    "smile_cat": {
        "unicode": "1F638",
        "shortname": ":smile_cat:",
        "aliases": "",
        "keywords": "grinning cat face with smiling eyes animal cats cat smile grin grinning"
    },
    "kissing_cat": {
        "unicode": "1F63D",
        "shortname": ":kissing_cat:",
        "aliases": "",
        "keywords": "kissing cat face with closed eyes animal cats passion kiss puckered heart love"
    },
    "doughnut": {
        "unicode": "1F369",
        "shortname": ":doughnut:",
        "aliases": "",
        "keywords": "doughnut desert food snack sweet doughnut donut pastry fried dessert breakfast police homer sweet"
    },
    "couple_with_heart": {
        "unicode": "1F491",
        "shortname": ":couple_with_heart:",
        "aliases": "",
        "keywords": "couple with heart affection dating human like love marriage valentines"
    },
    "spades": {"unicode": "2660", "shortname": ":spades:", "aliases": "", "keywords": "black spade suit cards poker"},
    "bomb": {"unicode": "1F4A3", "shortname": ":bomb:", "aliases": "", "keywords": "bomb boom explode"},
    "guitar": {
        "unicode": "1F3B8",
        "shortname": ":guitar:",
        "aliases": "",
        "keywords": "guitar instrument music guitar string music instrument jam rock acoustic electric"
    },
    "space_invader": {
        "unicode": "1F47E",
        "shortname": ":space_invader:",
        "aliases": "",
        "keywords": "alien monster arcade game"
    },
    "maple_leaf": {
        "unicode": "1F341",
        "shortname": ":maple_leaf:",
        "aliases": "",
        "keywords": "maple leaf canada nature plant vegetable maple leaf syrup canada tree"
    },
    "pig": {"unicode": "1F437", "shortname": ":pig:", "aliases": "", "keywords": "pig face animal oink"},
    "guardsman": {
        "unicode": "1F482",
        "shortname": ":guardsman:",
        "aliases": "",
        "keywords": "guardsman british gb male man uk guardsman guard bearskin hat british queen ceremonial military"
    },
    "fork_and_knife": {
        "unicode": "1F374",
        "shortname": ":fork_and_knife:",
        "aliases": "",
        "keywords": "fork and knife cutlery kitchen fork knife restaurant meal food eat"
    },
    "lips": {"unicode": "1F444", "shortname": ":lips:", "aliases": "", "keywords": "mouth kiss mouth"},
    "santa": {
        "unicode": "1F385",
        "shortname": ":santa:",
        "aliases": "",
        "keywords": "father christmas christmas father christmas festival male man xmas santa saint nick jolly ho ho ho north pole presents gifts naughty nice sleigh father christmas holiday"
    },
    "beer": {
        "unicode": "1F37A",
        "shortname": ":beer:",
        "aliases": "",
        "keywords": "beer mug beverage drink drunk party pub relax beer hops mug barley malt yeast portland oregon brewery micro pint boot"
    },
    "red_car": {
        "unicode": "1F697",
        "shortname": ":red_car:",
        "aliases": "",
        "keywords": "automobile transportation vehicle"
    },
    "zap": {
        "unicode": "26A1",
        "shortname": ":zap:",
        "aliases": "",
        "keywords": "high voltage sign lightning bolt thunder weather"
    },
    "ocean": {
        "unicode": "1F30A",
        "shortname": ":ocean:",
        "aliases": "",
        "keywords": "water wave sea water wave ocean wave surf beach tide"
    },
    "banana": {
        "unicode": "1F34C",
        "shortname": ":banana:",
        "aliases": "",
        "keywords": "banana food fruit banana peel bunch"
    },
    "turtle": {
        "unicode": "1F422",
        "shortname": ":turtle:",
        "aliases": "",
        "keywords": "turtle animal slow turtle shell tortoise chelonian reptile slow snap steady"
    },
    "movie_camera": {
        "unicode": "1F3A5",
        "shortname": ":movie_camera:",
        "aliases": "",
        "keywords": "movie camera film record movie camera camcorder video motion picture"
    },
    "video_game": {
        "unicode": "1F3AE",
        "shortname": ":video_game:",
        "aliases": "",
        "keywords": "video game PS4 console controller play video game console controller nintendo xbox playstation"
    },
    "trophy": {
        "unicode": "1F3C6",
        "shortname": ":trophy:",
        "aliases": "",
        "keywords": "trophy award ceremony contest ftw place win trophy first show place win reward achievement medal"
    },
    "man": {"unicode": "1F468", "shortname": ":man:", "aliases": "", "keywords": "man classy dad father guy mustashe"},
    "umbrella": {
        "unicode": "2614",
        "shortname": ":umbrella:",
        "aliases": "",
        "keywords": "umbrella with rain drops rain weather"
    },
    "tiger": {"unicode": "1F42F", "shortname": ":tiger:", "aliases": "", "keywords": "tiger face animal"},
    "smoking": {
        "unicode": "1F6AC",
        "shortname": ":smoking:",
        "aliases": "",
        "keywords": "smoking symbol cigarette kills tobacco smoking cigarette smoke cancer lungs inhale tar nicotine"
    },
    "watermelon": {
        "unicode": "1F349",
        "shortname": ":watermelon:",
        "aliases": "",
        "keywords": "watermelon food fruit melon watermelon summer fruit large"
    },
    "person_with_pouting_face": {
        "unicode": "1F64E",
        "shortname": ":person_with_pouting_face:",
        "aliases": "",
        "keywords": "person with pouting face female girl woman pout sexy cute annoyed"
    },
    "herb": {
        "unicode": "1F33F",
        "shortname": ":herb:",
        "aliases": "",
        "keywords": "herb grass lawn medicine plant vegetable weed herb spice plant cook cooking"
    },
    "footprints": {"unicode": "1F463", "shortname": ":footprints:", "aliases": "", "keywords": "footprints feet"},
    "camera": {"unicode": "1F4F7", "shortname": ":camera:", "aliases": "", "keywords": "camera gadgets photo"},
    "japanese_ogre": {
        "unicode": "1F479",
        "shortname": ":japanese_ogre:",
        "aliases": "",
        "keywords": "japanese ogre monster japanese oni demon troll ogre folklore monster devil mask theater horns teeth"
    },
    "cookie": {
        "unicode": "1F36A",
        "shortname": ":cookie:",
        "aliases": "",
        "keywords": "cookie chocolate food oreo snack cookie dessert biscuit sweet chocolate"
    },
    "recycle": {
        "unicode": "267B",
        "shortname": ":recycle:",
        "aliases": "",
        "keywords": "black universal recycling symbol arrow environment garbage trash"
    },
    "wine_glass": {
        "unicode": "1F377",
        "shortname": ":wine_glass:",
        "aliases": "",
        "keywords": "wine glass alcohol beverage booze bottle drink drunk fermented glass grapes tasting wine winery"
    },
    "arrow_right": {
        "unicode": "27A1",
        "shortname": ":arrow_right:",
        "aliases": "",
        "keywords": "black rightwards arrow blue-square next"
    },
    "panda_face": {
        "unicode": "1F43C",
        "shortname": ":panda_face:",
        "aliases": "",
        "keywords": "panda face animal nature panda bear face cub cute endearment friendship love bamboo china black white"
    },
    "dollar": {
        "unicode": "1F4B5",
        "shortname": ":dollar:",
        "aliases": "",
        "keywords": "banknote with dollar sign bill currency money dollar united states canada australia banknote money currency paper cash bills"
    },
    "hamburger": {
        "unicode": "1F354",
        "shortname": ":hamburger:",
        "aliases": "",
        "keywords": "hamburger food meat hamburger burger meat cow beef"
    },
    "icecream": {
        "unicode": "1F366",
        "shortname": ":icecream:",
        "aliases": "",
        "keywords": "soft ice cream desert food hot icecream ice cream dairy dessert cold soft serve cone yogurt"
    },
    "fries": {
        "unicode": "1F35F",
        "shortname": ":fries:",
        "aliases": "",
        "keywords": "french fries chips food fries french potato fry russet idaho"
    },
    "arrow_left": {
        "unicode": "2B05",
        "shortname": ":arrow_left:",
        "aliases": "",
        "keywords": "leftwards black arrow arrow blue-square previous"
    },
    "rainbow": {
        "unicode": "1F308",
        "shortname": ":rainbow:",
        "aliases": "",
        "keywords": "rainbow happy nature photo sky unicorn rainbow color pride diversity spectrum refract leprechaun gold"
    },
    "earth_asia": {
        "unicode": "1F30F",
        "shortname": ":earth_asia:",
        "aliases": "",
        "keywords": "earth globe asia-australia east globe international world earth globe space planet asia australia home"
    },
    "anger": {"unicode": "1F4A2", "shortname": ":anger:", "aliases": "", "keywords": "anger symbol anger angry mad"},
    "swimmer": {
        "unicode": "1F3CA",
        "shortname": ":swimmer:",
        "aliases": "",
        "keywords": "swimmer sports swimmer swim water pool laps freestyle butterfly breaststroke backstroke"
    },
    "blossom": {
        "unicode": "1F33C",
        "shortname": ":blossom:",
        "aliases": "",
        "keywords": "blossom flowers nature yellow blossom daisy flower"
    },
    "calling": {
        "unicode": "1F4F2",
        "shortname": ":calling:",
        "aliases": "",
        "keywords": "mobile phone with rightwards arrow at left incoming iphone"
    },
    "haircut": {"unicode": "1F487", "shortname": ":haircut:", "aliases": "", "keywords": "haircut female girl woman"},
    "heart_decoration": {
        "unicode": "1F49F",
        "shortname": ":heart_decoration:",
        "aliases": "",
        "keywords": "heart decoration like love purple-square"
    },
    "cake": {
        "unicode": "1F370",
        "shortname": ":cake:",
        "aliases": "",
        "keywords": "shortcake desert food cake short dessert strawberry"
    },
    "lollipop": {
        "unicode": "1F36D",
        "shortname": ":lollipop:",
        "aliases": "",
        "keywords": "lollipop candy food snack sweet lollipop stick lick sweet sugar candy"
    },
    "pouting_cat": {
        "unicode": "1F63E",
        "shortname": ":pouting_cat:",
        "aliases": "",
        "keywords": "pouting cat face animal cats pout annoyed miffed glower frown"
    },
    "syringe": {
        "unicode": "1F489",
        "shortname": ":syringe:",
        "aliases": "",
        "keywords": "syringe blood drugs health hospital medicine needle"
    },
    "registered": {
        "unicode": "00AE",
        "shortname": ":registered:",
        "aliases": "",
        "keywords": "registered sign alphabet circle"
    },
    "partly_sunny": {
        "unicode": "26C5",
        "shortname": ":partly_sunny:",
        "aliases": "",
        "keywords": "sun behind cloud cloud morning nature weather"
    },
    "iphone": {
        "unicode": "1F4F1",
        "shortname": ":iphone:",
        "aliases": "",
        "keywords": "mobile phone apple dial gadgets technology"
    },
    "arrow_backward": {
        "unicode": "25C0",
        "shortname": ":arrow_backward:",
        "aliases": "",
        "keywords": "black left-pointing triangle arrow blue-square"
    },
    "whale": {
        "unicode": "1F433",
        "shortname": ":whale:",
        "aliases": "",
        "keywords": "spouting whale animal nature ocean sea"
    },
    "envelope": {
        "unicode": "2709",
        "shortname": ":envelope:",
        "aliases": "",
        "keywords": "envelope communication letter mail postal"
    },
    "tropical_drink": {
        "unicode": "1F379",
        "shortname": ":tropical_drink:",
        "aliases": "",
        "keywords": "tropical drink beverage tropical drink mixed pineapple coconut pina fruit umbrella"
    },
    "cocktail": {
        "unicode": "1F378",
        "shortname": ":cocktail:",
        "aliases": "",
        "keywords": "cocktail glass alcohol beverage drink drunk cocktail mixed drink alcohol glass martini bar"
    },
    "hatching_chick": {
        "unicode": "1F423",
        "shortname": ":hatching_chick:",
        "aliases": "",
        "keywords": "hatching chick born chicken egg chick egg baby bird chicken young woman cute"
    },
    "smiley_cat": {
        "unicode": "1F63A",
        "shortname": ":smiley_cat:",
        "aliases": "",
        "keywords": "smiling cat face with open mouth animal cats happy smile smiley cat happy"
    },
    "fallen_leaf": {
        "unicode": "1F342",
        "shortname": ":fallen_leaf:",
        "aliases": "",
        "keywords": "fallen leaf leaves nature plant vegetable leaf fall color deciduous autumn"
    },
    "bear": {"unicode": "1F43B", "shortname": ":bear:", "aliases": "", "keywords": "bear face animal nature"},
    "man_with_turban": {
        "unicode": "1F473",
        "shortname": ":man_with_turban:",
        "aliases": "",
        "keywords": "man with turban male turban headdress headwear pagri india indian mummy wisdom peace"
    },
    "monkey": {
        "unicode": "1F412",
        "shortname": ":monkey:",
        "aliases": "",
        "keywords": "monkey animal nature monkey primate banana silly"
    },
    "full_moon": {
        "unicode": "1F315",
        "shortname": ":full_moon:",
        "aliases": "",
        "keywords": "full moon symbol nature yellow moon full sky night cheese phase monster spooky werewolves twilight"
    },
    "chocolate_bar": {
        "unicode": "1F36B",
        "shortname": ":chocolate_bar:",
        "aliases": "",
        "keywords": "chocolate bar desert food snack chocolate bar candy coca hershey's"
    },
    "rabbit": {"unicode": "1F430", "shortname": ":rabbit:", "aliases": "", "keywords": "rabbit face animal nature"},
    "musical_score": {
        "unicode": "1F3BC",
        "shortname": ":musical_score:",
        "aliases": "",
        "keywords": "musical score clef treble music musical score clef g-clef stave staff"
    },
    "snake": {"unicode": "1F40D", "shortname": ":snake:", "aliases": "", "keywords": "snake animal evil"},
    "bee": {
        "unicode": "1F41D",
        "shortname": ":bee:",
        "aliases": "",
        "keywords": "honeybee animal insect bee queen buzz flower pollen sting honey hive bumble pollination"
    },
    "mortar_board": {
        "unicode": "1F393",
        "shortname": ":mortar_board:",
        "aliases": "",
        "keywords": "graduation cap cap college degree graduation hat school university graduation cap mortarboard academic education ceremony square tassel"
    },
    "new_moon": {
        "unicode": "1F311",
        "shortname": ":new_moon:",
        "aliases": "",
        "keywords": "new moon symbol nature moon new sky night cheese phase"
    },
    "woman": {"unicode": "1F469", "shortname": ":woman:", "aliases": "", "keywords": "woman female girls"},
    "baseball": {"unicode": "26BE", "shortname": ":baseball:", "aliases": "", "keywords": "baseball MLB balls sports"},
    "older_woman": {
        "unicode": "1F475",
        "shortname": ":older_woman:",
        "aliases": ":grandma:",
        "keywords": "older woman female girl women grandma grandmother"
    },
    "no_entry_sign": {
        "unicode": "1F6AB",
        "shortname": ":no_entry_sign:",
        "aliases": "",
        "keywords": "no entry sign denied disallow forbid limit stop no stop entry"
    },
    "dolphin": {
        "unicode": "1F42C",
        "shortname": ":dolphin:",
        "aliases": "",
        "keywords": "dolphin animal fins fish flipper nature ocean sea"
    },
    "books": {"unicode": "1F4DA", "shortname": ":books:", "aliases": "", "keywords": "books library literature"},
    "bikini": {
        "unicode": "1F459",
        "shortname": ":bikini:",
        "aliases": "",
        "keywords": "bikini beach fashion female girl swimming woman"
    },
    "strawberry": {
        "unicode": "1F353",
        "shortname": ":strawberry:",
        "aliases": "",
        "keywords": "strawberry food fruit nature strawberry short cake berry"
    },
    "feet": {
        "unicode": "1F43E",
        "shortname": ":feet:",
        "aliases": "",
        "keywords": "paw prints animal cat dog footprints paw pet tracking paw prints mark imprints footsteps animal lion bear dog cat raccoon critter feet pawsteps"
    },
    "family": {
        "unicode": "1F46A",
        "shortname": ":family:",
        "aliases": "",
        "keywords": "family child dad father home mom mother parents family mother father child girl boy group unit"
    },
    "hatched_chick": {
        "unicode": "1F425",
        "shortname": ":hatched_chick:",
        "aliases": "",
        "keywords": "front-facing baby chick baby chicken chick baby bird chicken young woman cute"
    },
    "nose": {"unicode": "1F443", "shortname": ":nose:", "aliases": "", "keywords": "nose smell sniff"},
    "cherries": {
        "unicode": "1F352",
        "shortname": ":cherries:",
        "aliases": "",
        "keywords": "cherries food fruit cherry cherries tree fruit pit"
    },
    "jack_o_lantern": {
        "unicode": "1F383",
        "shortname": ":jack_o_lantern:",
        "aliases": "",
        "keywords": "jack-o-lantern halloween jack-o-lantern pumpkin halloween holiday carve autumn fall october saints costume spooky horror scary scared dead"
    },
    "ear_of_rice": {
        "unicode": "1F33E",
        "shortname": ":ear_of_rice:",
        "aliases": "",
        "keywords": "ear of rice nature plant ear rice food plant seed"
    },
    "scissors": {
        "unicode": "2702",
        "shortname": ":scissors:",
        "aliases": "",
        "keywords": "black scissors cut stationery"
    },
    "frog": {"unicode": "1F438", "shortname": ":frog:", "aliases": "", "keywords": "frog face animal nature"},
    "octopus": {
        "unicode": "1F419",
        "shortname": ":octopus:",
        "aliases": "",
        "keywords": "octopus animal creature ocean sea"
    },
    "high_heel": {
        "unicode": "1F460",
        "shortname": ":high_heel:",
        "aliases": "",
        "keywords": "high-heeled shoe fashion female shoes"
    },
    "loud_sound": {
        "unicode": "1F50A",
        "shortname": ":loud_sound:",
        "aliases": "",
        "keywords": "speaker with three sound waves "
    },
    "top": {
        "unicode": "1F51D",
        "shortname": ":top:",
        "aliases": "",
        "keywords": "top with upwards arrow above blue-square words"
    },
    "house_with_garden": {
        "unicode": "1F3E1",
        "shortname": ":house_with_garden:",
        "aliases": "",
        "keywords": "house with garden home nature plant"
    },
    "rotating_light": {
        "unicode": "1F6A8",
        "shortname": ":rotating_light:",
        "aliases": "",
        "keywords": "police cars revolving light 911 ambulance emergency police light police emergency"
    },
    "lipstick": {
        "unicode": "1F484",
        "shortname": ":lipstick:",
        "aliases": "",
        "keywords": "lipstick fashion female girl"
    },
    "ear": {"unicode": "1F442", "shortname": ":ear:", "aliases": "", "keywords": "ear face hear listen sound"},
    "first_quarter_moon": {
        "unicode": "1F313",
        "shortname": ":first_quarter_moon:",
        "aliases": "",
        "keywords": "first quarter moon symbol nature moon quarter first sky night cheese phase"
    },
    "pineapple": {
        "unicode": "1F34D",
        "shortname": ":pineapple:",
        "aliases": "",
        "keywords": "pineapple food fruit nature pineapple pina tropical flower"
    },
    "elephant": {
        "unicode": "1F418",
        "shortname": ":elephant:",
        "aliases": "",
        "keywords": "elephant animal nature nose thailand"
    },
    "athletic_shoe": {
        "unicode": "1F45F",
        "shortname": ":athletic_shoe:",
        "aliases": "",
        "keywords": "athletic shoe shoes sports"
    },
    "crystal_ball": {
        "unicode": "1F52E",
        "shortname": ":crystal_ball:",
        "aliases": "",
        "keywords": "crystal ball disco party"
    },
    "love_letter": {
        "unicode": "1F48C",
        "shortname": ":love_letter:",
        "aliases": "",
        "keywords": "love letter affection email envelope like valentines love letter kiss heart"
    },
    "waxing_gibbous_moon": {
        "unicode": "1F314",
        "shortname": ":waxing_gibbous_moon:",
        "aliases": "",
        "keywords": "waxing gibbous moon symbol nature"
    },
    "girl": {"unicode": "1F467", "shortname": ":girl:", "aliases": "", "keywords": "girl female woman"},
    "cool": {"unicode": "1F192", "shortname": ":cool:", "aliases": "", "keywords": "squared cool blue-square words"},
    "white_circle": {
        "unicode": "26AA",
        "shortname": ":white_circle:",
        "aliases": "",
        "keywords": "medium white circle shape"
    },
    "poultry_leg": {
        "unicode": "1F357",
        "shortname": ":poultry_leg:",
        "aliases": "",
        "keywords": "poultry leg food meat poultry leg chicken fried"
    },
    "speech_balloon": {
        "unicode": "1F4AC",
        "shortname": ":speech_balloon:",
        "aliases": "",
        "keywords": "speech balloon bubble words speech balloon talk conversation communication comic dialogue"
    },
    "question": {
        "unicode": "2753",
        "shortname": ":question:",
        "aliases": "",
        "keywords": "black question mark ornament confused doubt"
    },
    "tropical_fish": {
        "unicode": "1F420",
        "shortname": ":tropical_fish:",
        "aliases": "",
        "keywords": "tropical fish animal swim"
    },
    "older_man": {
        "unicode": "1F474",
        "shortname": ":older_man:",
        "aliases": "",
        "keywords": "older man human male men"
    },
    "bride_with_veil": {
        "unicode": "1F470",
        "shortname": ":bride_with_veil:",
        "aliases": "",
        "keywords": "bride with veil couple marriage wedding bride wedding planning veil gown dress engagement white"
    },
    "peach": {
        "unicode": "1F351",
        "shortname": ":peach:",
        "aliases": "",
        "keywords": "peach food fruit nature peach fruit juicy pit"
    },
    "eyeglasses": {
        "unicode": "1F453",
        "shortname": ":eyeglasses:",
        "aliases": "",
        "keywords": "eyeglasses accessories eyesight fashion eyeglasses spectacles eye sight nearsightedness myopia farsightedness hyperopia frames vision see blurry contacts"
    },
    "pencil": {
        "unicode": "1F4DD",
        "shortname": ":pencil:",
        "aliases": "",
        "keywords": "memo documents paper station write"
    },
    "spaghetti": {
        "unicode": "1F35D",
        "shortname": ":spaghetti:",
        "aliases": "",
        "keywords": "spaghetti food italian noodle spaghetti noodles tomato sauce italian"
    },
    "boy": {"unicode": "1F466", "shortname": ":boy:", "aliases": "", "keywords": "boy guy male man"},
    "black_circle": {
        "unicode": "26AB",
        "shortname": ":black_circle:",
        "aliases": "",
        "keywords": "medium black circle shape"
    },
    "book": {"unicode": "1F4D6", "shortname": ":book:", "aliases": "", "keywords": "open book library literature"},
    "pill": {"unicode": "1F48A", "shortname": ":pill:", "aliases": "", "keywords": "pill health medicine"},
    "loudspeaker": {
        "unicode": "1F4E2",
        "shortname": ":loudspeaker:",
        "aliases": "",
        "keywords": "public address loudspeaker sound volume"
    },
    "horse": {"unicode": "1F434", "shortname": ":horse:", "aliases": "", "keywords": "horse face animal brown"},
    "milky_way": {
        "unicode": "1F30C",
        "shortname": ":milky_way:",
        "aliases": "",
        "keywords": "milky way photo space milky galaxy star stars planets space sky"
    },
    "fish": {"unicode": "1F41F", "shortname": ":fish:", "aliases": "", "keywords": "fish animal food nature"},
    "surfer": {
        "unicode": "1F3C4",
        "shortname": ":surfer:",
        "aliases": "",
        "keywords": "surfer ocean sea sports surfer surf wave ocean ride swell"
    },
    "closed_lock_with_key": {
        "unicode": "1F510",
        "shortname": ":closed_lock_with_key:",
        "aliases": "",
        "keywords": "closed lock with key privacy security"
    },
    "warning": {"unicode": "26A0", "shortname": ":warning:", "aliases": "", "keywords": "warning sign exclamation wip"},
    "apple": {
        "unicode": "1F34E",
        "shortname": ":apple:",
        "aliases": "",
        "keywords": "red apple fruit mac apple fruit electronics red doctor teacher school core"
    },
    "fishing_pole_and_fish": {
        "unicode": "1F3A3",
        "shortname": ":fishing_pole_and_fish:",
        "aliases": "",
        "keywords": "fishing pole and fish food hobby fish fishing pole"
    },
    "dress": {"unicode": "1F457", "shortname": ":dress:", "aliases": "", "keywords": "dress clothes fashion"},
    "clapper": {
        "unicode": "1F3AC",
        "shortname": ":clapper:",
        "aliases": "",
        "keywords": "clapper board film movie record clapper board clapboard movie film take"
    },
    "man_with_gua_pi_mao": {
        "unicode": "1F472",
        "shortname": ":man_with_gua_pi_mao:",
        "aliases": "",
        "keywords": "man with gua pi mao boy male skullcap chinese asian qing"
    },
    "sunrise": {
        "unicode": "1F305",
        "shortname": ":sunrise:",
        "aliases": "",
        "keywords": "sunrise morning photo vacation view sunrise sun morning color sky"
    },
    "grapes": {
        "unicode": "1F347",
        "shortname": ":grapes:",
        "aliases": "",
        "keywords": "grapes food fruit grapes wine vinegar fruit cluster vine"
    },
    "first_quarter_moon_with_face": {
        "unicode": "1F31B",
        "shortname": ":first_quarter_moon_with_face:",
        "aliases": "",
        "keywords": "first quarter moon with face nature moon first quarter anthropomorphic face sky night cheese phase"
    },
    "telephone_receiver": {
        "unicode": "1F4DE",
        "shortname": ":telephone_receiver:",
        "aliases": "",
        "keywords": "telephone receiver communication dial technology"
    },
    "eight_spoked_asterisk": {
        "unicode": "2733",
        "shortname": ":eight_spoked_asterisk:",
        "aliases": "",
        "keywords": "eight spoked asterisk green-square sparkle star"
    },
    "sos": {
        "unicode": "1F198",
        "shortname": ":sos:",
        "aliases": "",
        "keywords": "squared sos emergency help red-square words"
    },
    "koala": {"unicode": "1F428", "shortname": ":koala:", "aliases": "", "keywords": "koala animal nature"},
    "blue_car": {
        "unicode": "1F699",
        "shortname": ":blue_car:",
        "aliases": "",
        "keywords": "recreational vehicle car suv car wagon automobile"
    },
    "arrow_down": {
        "unicode": "2B07",
        "shortname": ":arrow_down:",
        "aliases": "",
        "keywords": "downwards black arrow arrow blue-square"
    },
    "ramen": {
        "unicode": "1F35C",
        "shortname": ":ramen:",
        "aliases": "",
        "keywords": "steaming bowl chipsticks food japanese noodle ramen noodles bowl steaming soup"
    },
    "house": {
        "unicode": "1F3E0",
        "shortname": ":house:",
        "aliases": "",
        "keywords": "house building building home house home residence dwelling mansion bungalow ranch craftsman"
    },
    "pig_nose": {
        "unicode": "1F43D",
        "shortname": ":pig_nose:",
        "aliases": "",
        "keywords": "pig nose animal oink pig nose snout food eat cute oink pink smell truffle"
    },
    "anchor": {
        "unicode": "2693",
        "shortname": ":anchor:",
        "aliases": "",
        "keywords": "anchor ferry ship anchor ship boat ocean harbor marina shipyard sailor tattoo"
    },
    "art": {
        "unicode": "1F3A8",
        "shortname": ":art:",
        "aliases": "",
        "keywords": "artist palette design draw paint artist palette art colors paint draw brush pastels oils"
    },
    "chicken": {
        "unicode": "1F414",
        "shortname": ":chicken:",
        "aliases": "",
        "keywords": "chicken animal cluck chicken hen poultry livestock"
    },
    "wavy_dash": {"unicode": "3030", "shortname": ":wavy_dash:", "aliases": "", "keywords": "wavy dash draw line"},
    "monkey_face": {
        "unicode": "1F435",
        "shortname": ":monkey_face:",
        "aliases": "",
        "keywords": "monkey face animal nature"
    },
    "ok": {"unicode": "1F197", "shortname": ":ok:", "aliases": "", "keywords": "squared ok agree blue-square good yes"},
    "candy": {
        "unicode": "1F36C",
        "shortname": ":candy:",
        "aliases": "",
        "keywords": "candy desert snack candy sugar sweet hard"
    },
    "tangerine": {
        "unicode": "1F34A",
        "shortname": ":tangerine:",
        "aliases": "",
        "keywords": "tangerine food fruit nature tangerine citrus orange"
    },
    "m": {
        "unicode": "24C2",
        "shortname": ":m:",
        "aliases": "",
        "keywords": "circled latin capital letter m alphabet blue-circle letter"
    },
    "bath": {
        "unicode": "1F6C0",
        "shortname": ":bath:",
        "aliases": "",
        "keywords": "bath clean shower bath tub basin wash bubble soak bathroom soap water clean shampoo lather water"
    },
    "cow": {"unicode": "1F42E", "shortname": ":cow:", "aliases": "", "keywords": "cow face animal beef ox"},
    "mushroom": {
        "unicode": "1F344",
        "shortname": ":mushroom:",
        "aliases": "",
        "keywords": "mushroom plant vegetable mushroom fungi food fungus"
    },
    "mouse": {"unicode": "1F42D", "shortname": ":mouse:", "aliases": "", "keywords": "mouse face animal nature"},
    "large_blue_circle": {
        "unicode": "1F535",
        "shortname": ":large_blue_circle:",
        "aliases": "",
        "keywords": "large blue circle "
    },
    "japanese_goblin": {
        "unicode": "1F47A",
        "shortname": ":japanese_goblin:",
        "aliases": "",
        "keywords": "japanese goblin evil mask red japanese tengu supernatural avian demon goblin mask theater nose frown mustache anger frustration"
    },
    "moyai": {"unicode": "1F5FF", "shortname": ":moyai:", "aliases": "", "keywords": "moyai island stone"},
    "egg": {
        "unicode": "1F373",
        "shortname": ":egg:",
        "aliases": "",
        "keywords": "cooking breakfast food egg fry pan flat cook frying cooking utensil"
    },
    "tennis": {
        "unicode": "1F3BE",
        "shortname": ":tennis:",
        "aliases": "",
        "keywords": "tennis racquet and ball balls green sports tennis racket racquet ball game net court love"
    },
    "fireworks": {
        "unicode": "1F386",
        "shortname": ":fireworks:",
        "aliases": "",
        "keywords": "fireworks carnival congratulations festival photo fireworks independence celebration explosion july 4th rocket sky idea excitement"
    },
    "racehorse": {
        "unicode": "1F40E",
        "shortname": ":racehorse:",
        "aliases": "",
        "keywords": "horse animal gamble horse powerful draft calvary cowboy cowgirl mounted race ride gallop trot colt filly mare stallion gelding yearling thoroughbred pony"
    },
    "bread": {
        "unicode": "1F35E",
        "shortname": ":bread:",
        "aliases": "",
        "keywords": "bread breakfast food toast wheat bread loaf yeast"
    },
    "bird": {"unicode": "1F426", "shortname": ":bird:", "aliases": "", "keywords": "bird animal fly nature tweet"},
    "droplet": {
        "unicode": "1F4A7",
        "shortname": ":droplet:",
        "aliases": "",
        "keywords": "droplet drip faucet water drop droplet h20 water aqua tear sweat rain moisture wet moist spit"
    },
    "fried_shrimp": {
        "unicode": "1F364",
        "shortname": ":fried_shrimp:",
        "aliases": "",
        "keywords": "fried shrimp animal food shrimp fried seafood small fish"
    },
    "key": {"unicode": "1F511", "shortname": ":key:", "aliases": "", "keywords": "key door lock password"},
    "back": {
        "unicode": "1F519",
        "shortname": ":back:",
        "aliases": "",
        "keywords": "back with leftwards arrow above arrow"
    },
    "bike": {
        "unicode": "1F6B2",
        "shortname": ":bike:",
        "aliases": "",
        "keywords": "bicycle bicycle exercise hipster sports bike pedal bicycle transportation"
    },
    "pencil2": {
        "unicode": "270F",
        "shortname": ":pencil2:",
        "aliases": "",
        "keywords": "pencil paper stationery write"
    },
    "shaved_ice": {
        "unicode": "1F367",
        "shortname": ":shaved_ice:",
        "aliases": "",
        "keywords": "shaved ice desert hot shaved ice dessert treat syrup flavoring"
    },
    "arrow_right_hook": {
        "unicode": "21AA",
        "shortname": ":arrow_right_hook:",
        "aliases": "",
        "keywords": "rightwards arrow with hook blue-square"
    },
    "bulb": {
        "unicode": "1F4A1",
        "shortname": ":bulb:",
        "aliases": "",
        "keywords": "electric light bulb electricity light idea bulb light"
    },
    "tophat": {
        "unicode": "1F3A9",
        "shortname": ":tophat:",
        "aliases": "",
        "keywords": "top hat classy gentleman magic top hat cap beaver high tall stove pipe chimney topper london period piece magic magician"
    },
    "wolf": {"unicode": "1F43A", "shortname": ":wolf:", "aliases": "", "keywords": "wolf face animal nature"},
    "night_with_stars": {
        "unicode": "1F303",
        "shortname": ":night_with_stars:",
        "aliases": "",
        "keywords": "night with stars night star cloudless evening planets space sky"
    },
    "grey_exclamation": {
        "unicode": "2755",
        "shortname": ":grey_exclamation:",
        "aliases": "",
        "keywords": "white exclamation mark ornament surprise"
    },
    "alarm_clock": {
        "unicode": "23F0",
        "shortname": ":alarm_clock:",
        "aliases": "",
        "keywords": "alarm clock time wake"
    },
    "cop": {
        "unicode": "1F46E",
        "shortname": ":cop:",
        "aliases": "",
        "keywords": "police officer arrest enforcement law man police"
    },
    "arrow_lower_left": {
        "unicode": "2199",
        "shortname": ":arrow_lower_left:",
        "aliases": "",
        "keywords": "south west arrow arrow blue-square"
    },
    "person_with_blond_hair": {
        "unicode": "1F471",
        "shortname": ":person_with_blond_hair:",
        "aliases": "",
        "keywords": "person with blond hair male man blonde young western westerner occidental"
    },
    "jeans": {
        "unicode": "1F456",
        "shortname": ":jeans:",
        "aliases": "",
        "keywords": "jeans fashion shopping jeans pants blue denim levi's levi designer work skinny"
    },
    "sheep": {
        "unicode": "1F411",
        "shortname": ":sheep:",
        "aliases": "",
        "keywords": "sheep animal nature sheep wool flock follower ewe female lamb"
    },
    "golf": {"unicode": "26F3", "shortname": ":golf:", "aliases": "", "keywords": "flag in hole business sports"},
    "arrow_upper_right": {
        "unicode": "2197",
        "shortname": ":arrow_upper_right:",
        "aliases": "",
        "keywords": "north east arrow blue-square"
    },
    "watch": {"unicode": "231A", "shortname": ":watch:", "aliases": "", "keywords": "watch accessories time"},
    "performing_arts": {
        "unicode": "1F3AD",
        "shortname": ":performing_arts:",
        "aliases": "",
        "keywords": "performing arts acting drama theater performing arts performance entertainment acting story mask masks"
    },
    "bug": {
        "unicode": "1F41B",
        "shortname": ":bug:",
        "aliases": "",
        "keywords": "bug insect nature bug insect virus error"
    },
    "sushi": {
        "unicode": "1F363",
        "shortname": ":sushi:",
        "aliases": "",
        "keywords": "sushi food japanese sushi fish raw nigiri japanese"
    },
    "baby_chick": {
        "unicode": "1F424",
        "shortname": ":baby_chick:",
        "aliases": "",
        "keywords": "baby chick animal chicken chick baby bird chicken young woman cute"
    },
    "small_blue_diamond": {
        "unicode": "1F539",
        "shortname": ":small_blue_diamond:",
        "aliases": "",
        "keywords": "small blue diamond shape"
    },
    "electric_plug": {
        "unicode": "1F50C",
        "shortname": ":electric_plug:",
        "aliases": "",
        "keywords": "electric plug charger power"
    },
    "lock": {"unicode": "1F512", "shortname": ":lock:", "aliases": "", "keywords": "lock password security"},
    "black_square_button": {
        "unicode": "1F532",
        "shortname": ":black_square_button:",
        "aliases": "",
        "keywords": "black square button frame"
    },
    "fish_cake": {
        "unicode": "1F365",
        "shortname": ":fish_cake:",
        "aliases": "",
        "keywords": "fish cake with swirl design food fish cake kamboko swirl ramen noodles naruto"
    },
    "seedling": {
        "unicode": "1F331",
        "shortname": ":seedling:",
        "aliases": "",
        "keywords": "seedling grass lawn nature plant seedling plant new start grow"
    },
    "corn": {
        "unicode": "1F33D",
        "shortname": ":corn:",
        "aliases": "",
        "keywords": "ear of maize food plant vegetable corn maize food iowa kernel popcorn husk yellow stalk cob ear"
    },
    "leftwards_arrow_with_hook": {
        "unicode": "21A9",
        "shortname": ":leftwards_arrow_with_hook:",
        "aliases": "",
        "keywords": "leftwards arrow with hook "
    },
    "arrow_heading_down": {
        "unicode": "2935",
        "shortname": ":arrow_heading_down:",
        "aliases": "",
        "keywords": "arrow pointing rightwards then curving downwards arrow blue-square"
    },
    "ant": {
        "unicode": "1F41C",
        "shortname": ":ant:",
        "aliases": "",
        "keywords": "ant animal insect ant queen insect team"
    },
    "checkered_flag": {
        "unicode": "1F3C1",
        "shortname": ":checkered_flag:",
        "aliases": "",
        "keywords": "chequered flag contest finishline gokart rase checkered chequred race flag finish complete end"
    },
    "tea": {
        "unicode": "1F375",
        "shortname": ":tea:",
        "aliases": "",
        "keywords": "teacup without handle bowl breakfast british drink green tea leaf drink teacup hot beverage"
    },
    "stew": {
        "unicode": "1F372",
        "shortname": ":stew:",
        "aliases": "",
        "keywords": "pot of food food meat stew hearty soup thick hot pot"
    },
    "arrow_up": {
        "unicode": "2B06",
        "shortname": ":arrow_up:",
        "aliases": "",
        "keywords": "upwards black arrow blue-square"
    },
    "underage": {
        "unicode": "1F51E",
        "shortname": ":underage:",
        "aliases": "",
        "keywords": "no one under eighteen symbol 18 drink night pub"
    },
    "snail": {
        "unicode": "1F40C",
        "shortname": ":snail:",
        "aliases": "",
        "keywords": "snail animal shell slow snail slow escargot french appetizer"
    },
    "meat_on_bone": {
        "unicode": "1F356",
        "shortname": ":meat_on_bone:",
        "aliases": "",
        "keywords": "meat on bone food good meat bone animal cooked"
    },
    "camel": {
        "unicode": "1F42B",
        "shortname": ":camel:",
        "aliases": "",
        "keywords": "bactrian camel animal hot nature bactrian camel hump desert central asia heat hot water hump day wednesday sex"
    },
    "necktie": {
        "unicode": "1F454",
        "shortname": ":necktie:",
        "aliases": "",
        "keywords": "necktie cloth fashion formal shirt suitup"
    },
    "toilet": {
        "unicode": "1F6BD",
        "shortname": ":toilet:",
        "aliases": "",
        "keywords": "toilet restroom wc toilet bathroom throne porcelain waste flush plumbing"
    },
    "a": {
        "unicode": "1F170",
        "shortname": ":a:",
        "aliases": "",
        "keywords": "negative squared latin capital letter a alphabet letter red-square"
    },
    "arrow_lower_right": {
        "unicode": "2198",
        "shortname": ":arrow_lower_right:",
        "aliases": "",
        "keywords": "south east arrow arrow blue-square"
    },
    "hamster": {"unicode": "1F439", "shortname": ":hamster:", "aliases": "", "keywords": "hamster face animal nature"},
    "fuelpump": {
        "unicode": "26FD",
        "shortname": ":fuelpump:",
        "aliases": "",
        "keywords": "fuel pump gas station petroleum"
    },
    "hammer": {
        "unicode": "1F528",
        "shortname": ":hammer:",
        "aliases": "",
        "keywords": "hammer done judge law ruling tools verdict"
    },
    "bust_in_silhouette": {
        "unicode": "1F464",
        "shortname": ":bust_in_silhouette:",
        "aliases": "",
        "keywords": "bust in silhouette human man person user silhouette person user member account guest icon avatar profile me myself i"
    },
    "up": {
        "unicode": "1F199",
        "shortname": ":up:",
        "aliases": "",
        "keywords": "squared up with exclamation mark blue-square"
    },
    "snowboarder": {
        "unicode": "1F3C2",
        "shortname": ":snowboarder:",
        "aliases": "",
        "keywords": "snowboarder sports winter snow boarding sports freestyle halfpipe board mountain alpine winter"
    },
    "curly_loop": {"unicode": "27B0", "shortname": ":curly_loop:", "aliases": "", "keywords": "curly loop scribble"},
    "handbag": {
        "unicode": "1F45C",
        "shortname": ":handbag:",
        "aliases": "",
        "keywords": "handbag accessories accessory bag fashion"
    },
    "dart": {
        "unicode": "1F3AF",
        "shortname": ":dart:",
        "aliases": "",
        "keywords": "direct hit bar game direct hit bullseye dart archery game fletching arrow sport"
    },
    "computer": {
        "unicode": "1F4BB",
        "shortname": ":computer:",
        "aliases": "",
        "keywords": "personal computer laptop tech"
    },
    "poodle": {
        "unicode": "1F429",
        "shortname": ":poodle:",
        "aliases": "",
        "keywords": "poodle 101 animal dog nature poodle dog clip showy sophisticated vain"
    },
    "cancer": {
        "unicode": "264B",
        "shortname": ":cancer:",
        "aliases": "",
        "keywords": "cancer cancer crab astrology greek constellation stars zodiac sign sign zodiac horoscope"
    },
    "rice": {
        "unicode": "1F35A",
        "shortname": ":rice:",
        "aliases": "",
        "keywords": "cooked rice food rice white grain food bowl"
    },
    "black_medium_small_square": {
        "unicode": "25FE",
        "shortname": ":black_medium_small_square:",
        "aliases": "",
        "keywords": "black medium small square "
    },
    "seat": {"unicode": "1F4BA", "shortname": ":seat:", "aliases": "", "keywords": "seat sit"},
    "shell": {
        "unicode": "1F41A",
        "shortname": ":shell:",
        "aliases": "",
        "keywords": "spiral shell beach nature sea shell spiral beach sand crab nautilus"
    },
    "trident": {"unicode": "1F531", "shortname": ":trident:", "aliases": "", "keywords": "trident emblem spear weapon"},
    "hotsprings": {
        "unicode": "2668",
        "shortname": ":hotsprings:",
        "aliases": "",
        "keywords": "hot springs bath relax warm"
    },
    "curry": {
        "unicode": "1F35B",
        "shortname": ":curry:",
        "aliases": "",
        "keywords": "curry and rice food hot indian spicy curry spice flavor food meal"
    },
    "ice_cream": {
        "unicode": "1F368",
        "shortname": ":ice_cream:",
        "aliases": "",
        "keywords": "ice cream desert food hot icecream ice cream dairy dessert cold soft serve cone waffle"
    },
    "diamond_shape_with_a_dot_inside": {
        "unicode": "1F4A0",
        "shortname": ":diamond_shape_with_a_dot_inside:",
        "aliases": "",
        "keywords": "diamond shape with a dot inside diamond cute cuteness kawaii japanese glyph adorable"
    },
    "green_apple": {
        "unicode": "1F34F",
        "shortname": ":green_apple:",
        "aliases": "",
        "keywords": "green apple fruit nature apple fruit green pie granny smith core"
    },
    "statue_of_liberty": {
        "unicode": "1F5FD",
        "shortname": ":statue_of_liberty:",
        "aliases": "",
        "keywords": "statue of liberty american newyork"
    },
    "bus": {
        "unicode": "1F68C",
        "shortname": ":bus:",
        "aliases": "",
        "keywords": "bus car transportation vehicle bus school city transportation public"
    },
    "bowling": {
        "unicode": "1F3B3",
        "shortname": ":bowling:",
        "aliases": "",
        "keywords": "bowling fun play sports bowl bowling ball pin strike spare game"
    },
    "dolls": {
        "unicode": "1F38E",
        "shortname": ":dolls:",
        "aliases": "",
        "keywords": "japanese dolls japanese kimono toy dolls japan japanese day girls emperor empress pray blessing imperial family royal"
    },
    "baby_symbol": {
        "unicode": "1F6BC",
        "shortname": ":baby_symbol:",
        "aliases": "",
        "keywords": "baby symbol child orange-square baby crawl newborn human diaper small babe"
    },
    "construction_worker": {
        "unicode": "1F477",
        "shortname": ":construction_worker:",
        "aliases": "",
        "keywords": "construction worker human male man wip"
    },
    "custard": {
        "unicode": "1F36E",
        "shortname": ":custard:",
        "aliases": "",
        "keywords": "custard desert food custard cream rich butter dessert crème brûlée french"
    },
    "unlock": {"unicode": "1F513", "shortname": ":unlock:", "aliases": "", "keywords": "open lock privacy security"},
    "shirt": {"unicode": "1F455", "shortname": ":shirt:", "aliases": "", "keywords": "t-shirt cloth fashion"},
    "credit_card": {
        "unicode": "1F4B3",
        "shortname": ":credit_card:",
        "aliases": "",
        "keywords": "credit card bill dollar money pay payment credit card loan purchase shopping mastercard visa american express wallet signature"
    },
    "bento": {
        "unicode": "1F371",
        "shortname": ":bento:",
        "aliases": "",
        "keywords": "bento box box food japanese bento japanese rice meal box obento convenient lunchbox"
    },
    "beetle": {
        "unicode": "1F41E",
        "shortname": ":beetle:",
        "aliases": "",
        "keywords": "lady beetle insect nature lady bug ladybug ladybird beetle cow lady cow insect endearment"
    },
    "mans_shoe": {"unicode": "1F45E", "shortname": ":mans_shoe:", "aliases": "", "keywords": "mans shoe fashion male"},
    "chestnut": {
        "unicode": "1F330",
        "shortname": ":chestnut:",
        "aliases": "",
        "keywords": "chestnut food squirrel chestnut roasted food tree"
    },
    "interrobang": {
        "unicode": "2049",
        "shortname": ":interrobang:",
        "aliases": "",
        "keywords": "exclamation question mark punctuation surprise wat"
    },
    "small_red_triangle": {
        "unicode": "1F53A",
        "shortname": ":small_red_triangle:",
        "aliases": "",
        "keywords": "up-pointing red triangle shape"
    },
    "heavy_dollar_sign": {
        "unicode": "1F4B2",
        "shortname": ":heavy_dollar_sign:",
        "aliases": "",
        "keywords": "heavy dollar sign currency money payment dollar currency money cash sale purchase value"
    },
    "battery": {
        "unicode": "1F50B",
        "shortname": ":battery:",
        "aliases": "",
        "keywords": "battery energy power sustain"
    },
    "black_nib": {"unicode": "2712", "shortname": ":black_nib:", "aliases": "", "keywords": "black nib pen stationery"},
    "police_car": {
        "unicode": "1F693",
        "shortname": ":police_car:",
        "aliases": "",
        "keywords": "police car cars enforcement law transportation vehicle police car emergency ticket citation crime help officer"
    },
    "honey_pot": {
        "unicode": "1F36F",
        "shortname": ":honey_pot:",
        "aliases": "",
        "keywords": "honey pot bees sweet honey pot bees pooh bear"
    },
    "small_orange_diamond": {
        "unicode": "1F538",
        "shortname": ":small_orange_diamond:",
        "aliases": "",
        "keywords": "small orange diamond shape"
    },
    "b": {
        "unicode": "1F171",
        "shortname": ":b:",
        "aliases": "",
        "keywords": "negative squared latin capital letter b alphabet letter red-square"
    },
    "arrows_clockwise": {
        "unicode": "1F503",
        "shortname": ":arrows_clockwise:",
        "aliases": "",
        "keywords": "clockwise downwards and upwards open circle arrows sync"
    },
    "roller_coaster": {
        "unicode": "1F3A2",
        "shortname": ":roller_coaster:",
        "aliases": "",
        "keywords": "roller coaster carnival fun photo play playground roller coaster amusement park fair ride entertainment"
    },
    "door": {
        "unicode": "1F6AA",
        "shortname": ":door:",
        "aliases": "",
        "keywords": "door entry exit house door doorway entrance enter exit entry"
    },
    "sunrise_over_mountains": {
        "unicode": "1F304",
        "shortname": ":sunrise_over_mountains:",
        "aliases": "",
        "keywords": "sunrise over mountains photo vacation view sunrise sun morning mountain rural color sky"
    },
    "8ball": {
        "unicode": "1F3B1",
        "shortname": ":8ball:",
        "aliases": "",
        "keywords": "billiards pool billiards eight ball pool pocket ball cue"
    },
    "eight_pointed_black_star": {
        "unicode": "2734",
        "shortname": ":eight_pointed_black_star:",
        "aliases": "",
        "keywords": "eight pointed black star "
    },
    "musical_keyboard": {
        "unicode": "1F3B9",
        "shortname": ":musical_keyboard:",
        "aliases": "",
        "keywords": "musical keyboard instrument piano music keyboard piano organ instrument electric"
    },
    "sparkler": {
        "unicode": "1F387",
        "shortname": ":sparkler:",
        "aliases": "",
        "keywords": "firework sparkler night shine stars"
    },
    "small_red_triangle_down": {
        "unicode": "1F53B",
        "shortname": ":small_red_triangle_down:",
        "aliases": "",
        "keywords": "down-pointing red triangle shape"
    },
    "arrow_upper_left": {
        "unicode": "2196",
        "shortname": ":arrow_upper_left:",
        "aliases": "",
        "keywords": "north west arrow blue-square"
    },
    "left_right_arrow": {
        "unicode": "2194",
        "shortname": ":left_right_arrow:",
        "aliases": "",
        "keywords": "left right arrow shape"
    },
    "barber": {"unicode": "1F488", "shortname": ":barber:", "aliases": "", "keywords": "barber pole hair salon style"},
    "large_orange_diamond": {
        "unicode": "1F536",
        "shortname": ":large_orange_diamond:",
        "aliases": "",
        "keywords": "large orange diamond shape"
    },
    "hospital": {
        "unicode": "1F3E5",
        "shortname": ":hospital:",
        "aliases": "",
        "keywords": "hospital building doctor health surgery"
    },
    "city_dusk": {
        "unicode": "1F306",
        "shortname": ":city_dusk:",
        "aliases": "",
        "keywords": "cityscape at dusk photo city scape sunset dusk lights evening metropolitan night dark"
    },
    "scorpius": {
        "unicode": "264F",
        "shortname": ":scorpius:",
        "aliases": "",
        "keywords": "scorpius scorpius scorpion scorpio astrology greek constellation stars zodiac sign sign zodiac horoscope"
    },
    "sailboat": {
        "unicode": "26F5",
        "shortname": ":sailboat:",
        "aliases": "",
        "keywords": "sailboat ship transportation"
    },
    "tomato": {
        "unicode": "1F345",
        "shortname": ":tomato:",
        "aliases": "",
        "keywords": "tomato food fruit nature vegetable tomato fruit sauce italian"
    },
    "sparkle": {"unicode": "2747", "shortname": ":sparkle:", "aliases": "", "keywords": "sparkle green-square stars"},
    "closed_umbrella": {
        "unicode": "1F302",
        "shortname": ":closed_umbrella:",
        "aliases": "",
        "keywords": "closed umbrella drizzle rain weather umbrella closed rain moisture protection sun ultraviolet uv"
    },
    "heavy_plus_sign": {
        "unicode": "2795",
        "shortname": ":heavy_plus_sign:",
        "aliases": "",
        "keywords": "heavy plus sign calculation math"
    },
    "mega": {
        "unicode": "1F4E3",
        "shortname": ":mega:",
        "aliases": "",
        "keywords": "cheering megaphone sound speaker volume"
    },
    "large_blue_diamond": {
        "unicode": "1F537",
        "shortname": ":large_blue_diamond:",
        "aliases": "",
        "keywords": "large blue diamond shape"
    },
    "package": {"unicode": "1F4E6", "shortname": ":package:", "aliases": "", "keywords": "package gift mail"},
    "heavy_minus_sign": {
        "unicode": "2796",
        "shortname": ":heavy_minus_sign:",
        "aliases": "",
        "keywords": "heavy minus sign calculation math"
    },
    "city_sunset": {
        "unicode": "1F307",
        "shortname": ":city_sunset:",
        "aliases": ":city_sunrise:",
        "keywords": "sunset over buildings photo city scape sunrise dawn light morning metropolitan rise sun"
    },
    "soon": {
        "unicode": "1F51C",
        "shortname": ":soon:",
        "aliases": "",
        "keywords": "soon with rightwards arrow above arrow words"
    },
    "congratulations": {
        "unicode": "3297",
        "shortname": ":congratulations:",
        "aliases": "",
        "keywords": "circled ideograph congratulation chinese japanese kanji"
    },
    "secret": {
        "unicode": "3299",
        "shortname": ":secret:",
        "aliases": "",
        "keywords": "circled ideograph secret privacy"
    },
    "no_entry": {
        "unicode": "26D4",
        "shortname": ":no_entry:",
        "aliases": "",
        "keywords": "no entry bad denied limit privacy security stop"
    },
    "aries": {
        "unicode": "2648",
        "shortname": ":aries:",
        "aliases": "",
        "keywords": "aries aries ram astrology greek constellation stars zodiac sign purple-square sign zodiac horoscope"
    },
    "purse": {
        "unicode": "1F45B",
        "shortname": ":purse:",
        "aliases": "",
        "keywords": "purse accessories fashion money purse clutch bag handbag coin bag accessory money ladies shopping"
    },
    "dragon_face": {
        "unicode": "1F432",
        "shortname": ":dragon_face:",
        "aliases": "",
        "keywords": "dragon face animal chinese green myth nature dragon head fire legendary myth"
    },
    "leo": {
        "unicode": "264C",
        "shortname": ":leo:",
        "aliases": "",
        "keywords": "leo leo lion astrology greek constellation stars zodiac sign purple-square sign zodiac horoscope"
    },
    "ship": {
        "unicode": "1F6A2",
        "shortname": ":ship:",
        "aliases": "",
        "keywords": "ship titanic transportation ferry ship boat"
    },
    "white_flower": {
        "unicode": "1F4AE",
        "shortname": ":white_flower:",
        "aliases": "",
        "keywords": "white flower japanese white flower teacher school grade score brilliance intelligence homework student assignment praise"
    },
    "wedding": {
        "unicode": "1F492",
        "shortname": ":wedding:",
        "aliases": "",
        "keywords": "wedding affection bride couple groom like love marriage"
    },
    "boot": {"unicode": "1F462", "shortname": ":boot:", "aliases": "", "keywords": "womans boots fashion shoes"},
    "radio_button": {
        "unicode": "1F518",
        "shortname": ":radio_button:",
        "aliases": "",
        "keywords": "radio button input"
    },
    "notebook": {
        "unicode": "1F4D3",
        "shortname": ":notebook:",
        "aliases": "",
        "keywords": "notebook notes paper record stationery"
    },
    "gemini": {
        "unicode": "264A",
        "shortname": ":gemini:",
        "aliases": "",
        "keywords": "gemini gemini twins astrology greek constellation stars zodiac sign sign zodiac horoscope"
    },
    "bell": {
        "unicode": "1F514",
        "shortname": ":bell:",
        "aliases": "",
        "keywords": "bell chime christmas notification sound xmas"
    },
    "boar": {"unicode": "1F417", "shortname": ":boar:", "aliases": "", "keywords": "boar animal nature"},
    "ambulance": {
        "unicode": "1F691",
        "shortname": ":ambulance:",
        "aliases": "",
        "keywords": "ambulance 911 health ambulance emergency medical help assistance"
    },
    "mount_fuji": {
        "unicode": "1F5FB",
        "shortname": ":mount_fuji:",
        "aliases": "",
        "keywords": "mount fuji japan mountain nature photo"
    },
    "sandal": {"unicode": "1F461", "shortname": ":sandal:", "aliases": "", "keywords": "womans sandal fashion shoes"},
    "round_pushpin": {
        "unicode": "1F4CD",
        "shortname": ":round_pushpin:",
        "aliases": "",
        "keywords": "round pushpin stationery"
    },
    "keycap_ten": {
        "unicode": "1F51F",
        "shortname": ":keycap_ten:",
        "aliases": "",
        "keywords": "keycap ten 10 blue-square numbers"
    },
    "ledger": {"unicode": "1F4D2", "shortname": ":ledger:", "aliases": "", "keywords": "ledger notes paper"},
    "womans_hat": {
        "unicode": "1F452",
        "shortname": ":womans_hat:",
        "aliases": "",
        "keywords": "womans hat accessories fashion female"
    },
    "envelope_with_arrow": {
        "unicode": "1F4E9",
        "shortname": ":envelope_with_arrow:",
        "aliases": "",
        "keywords": "envelope with downwards arrow above email"
    },
    "black_joker": {
        "unicode": "1F0CF",
        "shortname": ":black_joker:",
        "aliases": "",
        "keywords": "playing card black joker cards game poker"
    },
    "part_alternation_mark": {
        "unicode": "303D",
        "shortname": ":part_alternation_mark:",
        "aliases": "",
        "keywords": "part alternation mark graph sing song vocal music karaoke cue letter m japanese"
    },
    "o2": {
        "unicode": "1F17E",
        "shortname": ":o2:",
        "aliases": "",
        "keywords": "negative squared latin capital letter o alphabet letter red-square"
    },
    "office": {
        "unicode": "1F3E2",
        "shortname": ":office:",
        "aliases": "",
        "keywords": "office building building bureau work"
    },
    "volcano": {
        "unicode": "1F30B",
        "shortname": ":volcano:",
        "aliases": "",
        "keywords": "volcano nature photo volcano lava magma hot explode"
    },
    "aquarius": {
        "unicode": "2652",
        "shortname": ":aquarius:",
        "aliases": "",
        "keywords": "aquarius aquarius water bearer astrology greek constellation stars zodiac sign purple-square sign zodiac horoscope"
    },
    "taurus": {
        "unicode": "2649",
        "shortname": ":taurus:",
        "aliases": "",
        "keywords": "taurus purple-square sign taurus bull astrology greek constellation stars zodiac sign zodiac horoscope"
    },
    "pushpin": {"unicode": "1F4CC", "shortname": ":pushpin:", "aliases": "", "keywords": "pushpin stationery"},
    "violin": {
        "unicode": "1F3BB",
        "shortname": ":violin:",
        "aliases": "",
        "keywords": "violin instrument music violin fiddle music instrument"
    },
    "virgo": {
        "unicode": "264D",
        "shortname": ":virgo:",
        "aliases": "",
        "keywords": "virgo sign virgo maiden astrology greek constellation stars zodiac sign zodiac horoscope"
    },
    "taxi": {
        "unicode": "1F695",
        "shortname": ":taxi:",
        "aliases": "",
        "keywords": "taxi cars transportation uber vehicle taxi car automobile city transport service"
    },
    "stars": {
        "unicode": "1F320",
        "shortname": ":stars:",
        "aliases": "",
        "keywords": "shooting star night photo shooting shoot star sky night comet meteoroid"
    },
    "speedboat": {
        "unicode": "1F6A4",
        "shortname": ":speedboat:",
        "aliases": "",
        "keywords": "speedboat ship transportation vehicle motor speed ski power boat"
    },
    "hourglass_flowing_sand": {
        "unicode": "23F3",
        "shortname": ":hourglass_flowing_sand:",
        "aliases": "",
        "keywords": "hourglass with flowing sand countdown oldschool time"
    },
    "ferris_wheel": {
        "unicode": "1F3A1",
        "shortname": ":ferris_wheel:",
        "aliases": "",
        "keywords": "ferris wheel carnival londoneye photo farris wheel amusement park fair ride entertainment"
    },
    "tent": {"unicode": "26FA", "shortname": ":tent:", "aliases": "", "keywords": "tent camp outdoors photo"},
    "love_hotel": {
        "unicode": "1F3E9",
        "shortname": ":love_hotel:",
        "aliases": "",
        "keywords": "love hotel affection dating like love hotel love sex romance leisure adultery prostitution hospital birth happy"
    },
    "church": {
        "unicode": "26EA",
        "shortname": ":church:",
        "aliases": "",
        "keywords": "church building christ religion"
    },
    "briefcase": {
        "unicode": "1F4BC",
        "shortname": ":briefcase:",
        "aliases": "",
        "keywords": "briefcase business documents work"
    },
    "womans_clothes": {
        "unicode": "1F45A",
        "shortname": ":womans_clothes:",
        "aliases": "",
        "keywords": "womans clothes fashion woman clothing clothes blouse shirt wardrobe breasts cleavage shopping shop dressing dressed"
    },
    "dvd": {"unicode": "1F4C0", "shortname": ":dvd:", "aliases": "", "keywords": "dvd cd disc disk"},
    "libra": {
        "unicode": "264E",
        "shortname": ":libra:",
        "aliases": "",
        "keywords": "libra libra scales astrology greek constellation stars zodiac sign purple-square sign zodiac horoscope"
    },
    "sagittarius": {
        "unicode": "2650",
        "shortname": ":sagittarius:",
        "aliases": "",
        "keywords": "sagittarius sagittarius centaur archer astrology greek constellation stars zodiac sign sign zodiac horoscope"
    },
    "oden": {
        "unicode": "1F362",
        "shortname": ":oden:",
        "aliases": "",
        "keywords": "oden food japanese oden seafood casserole stew"
    },
    "game_die": {
        "unicode": "1F3B2",
        "shortname": ":game_die:",
        "aliases": "",
        "keywords": "game die dice game die dice craps gamble play"
    },
    "grey_question": {
        "unicode": "2754",
        "shortname": ":grey_question:",
        "aliases": "",
        "keywords": "white question mark ornament doubts"
    },
    "fast_forward": {
        "unicode": "23E9",
        "shortname": ":fast_forward:",
        "aliases": "",
        "keywords": "black right-pointing double triangle blue-square"
    },
    "flashlight": {"unicode": "1F526", "shortname": ":flashlight:", "aliases": "", "keywords": "electric torch dark"},
    "triangular_flag_on_post": {
        "unicode": "1F6A9",
        "shortname": ":triangular_flag_on_post:",
        "aliases": "",
        "keywords": "triangular flag on post triangle triangular flag golf post flagpole"
    },
    "tanabata_tree": {
        "unicode": "1F38B",
        "shortname": ":tanabata_tree:",
        "aliases": "",
        "keywords": "tanabata tree nature plant tanabata tree festival star wish holiday"
    },
    "dango": {
        "unicode": "1F361",
        "shortname": ":dango:",
        "aliases": "",
        "keywords": "dango food dango japanese dumpling mochi balls skewer"
    },
    "signal_strength": {
        "unicode": "1F4F6",
        "shortname": ":signal_strength:",
        "aliases": "",
        "keywords": "antenna with bars blue-square"
    },
    "video_camera": {
        "unicode": "1F4F9",
        "shortname": ":video_camera:",
        "aliases": "",
        "keywords": "video camera film record"
    },
    "negative_squared_cross_mark": {
        "unicode": "274E",
        "shortname": ":negative_squared_cross_mark:",
        "aliases": "",
        "keywords": "negative squared cross mark deny green-square no x"
    },
    "black_medium_square": {
        "unicode": "25FC",
        "shortname": ":black_medium_square:",
        "aliases": "",
        "keywords": "black medium square shape"
    },
    "yen": {
        "unicode": "1F4B4",
        "shortname": ":yen:",
        "aliases": "",
        "keywords": "banknote with yen sign currency dollar japanese money yen japan japanese banknote money currency paper cash bill"
    },
    "blowfish": {
        "unicode": "1F421",
        "shortname": ":blowfish:",
        "aliases": "",
        "keywords": "blowfish food nature ocean sea blowfish pufferfish puffer ballonfish toadfish fugu fish sushi"
    },
    "white_large_square": {
        "unicode": "2B1C",
        "shortname": ":white_large_square:",
        "aliases": "",
        "keywords": "white large square shape"
    },
    "beginner": {
        "unicode": "1F530",
        "shortname": ":beginner:",
        "aliases": "",
        "keywords": "japanese symbol for beginner badge shield"
    },
    "school": {
        "unicode": "1F3EB",
        "shortname": ":school:",
        "aliases": "",
        "keywords": "school building school university elementary middle high college teach education"
    },
    "new": {"unicode": "1F195", "shortname": ":new:", "aliases": "", "keywords": "squared new blue-square"},
    "clock1": {
        "unicode": "1F550",
        "shortname": ":clock1:",
        "aliases": "",
        "keywords": "clock face one oclock clock time"
    },
    "womens": {
        "unicode": "1F6BA",
        "shortname": ":womens:",
        "aliases": "",
        "keywords": "womens symbol purple-square woman bathroom restroom sign girl female avatar"
    },
    "running_shirt_with_sash": {
        "unicode": "1F3BD",
        "shortname": ":running_shirt_with_sash:",
        "aliases": "",
        "keywords": "running shirt with sash pageant play running run shirt cloths compete sports"
    },
    "radio": {
        "unicode": "1F4FB",
        "shortname": ":radio:",
        "aliases": "",
        "keywords": "radio communication music podcast program"
    },
    "on": {
        "unicode": "1F51B",
        "shortname": ":on:",
        "aliases": "",
        "keywords": "on with exclamation mark with left right arrow abo arrow words"
    },
    "hourglass": {
        "unicode": "231B",
        "shortname": ":hourglass:",
        "aliases": "",
        "keywords": "hourglass clock oldschool time"
    },
    "pisces": {
        "unicode": "2653",
        "shortname": ":pisces:",
        "aliases": "",
        "keywords": "pisces pisces fish astrology greek constellation stars zodiac sign purple-square sign zodiac horoscope"
    },
    "nut_and_bolt": {
        "unicode": "1F529",
        "shortname": ":nut_and_bolt:",
        "aliases": "",
        "keywords": "nut and bolt handy tools"
    },
    "free": {"unicode": "1F193", "shortname": ":free:", "aliases": "", "keywords": "squared free blue-square words"},
    "bridge_at_night": {
        "unicode": "1F309",
        "shortname": ":bridge_at_night:",
        "aliases": "",
        "keywords": "bridge at night photo sanfrancisco bridge night water road evening suspension golden gate"
    },
    "saxophone": {
        "unicode": "1F3B7",
        "shortname": ":saxophone:",
        "aliases": "",
        "keywords": "saxophone instrument music saxophone sax music instrument woodwind"
    },
    "white_square_button": {
        "unicode": "1F533",
        "shortname": ":white_square_button:",
        "aliases": "",
        "keywords": "white square button shape"
    },
    "mobile_phone_off": {
        "unicode": "1F4F4",
        "shortname": ":mobile_phone_off:",
        "aliases": "",
        "keywords": "mobile phone off mute"
    },
    "closed_book": {
        "unicode": "1F4D5",
        "shortname": ":closed_book:",
        "aliases": "",
        "keywords": "closed book knowledge library read"
    },
    "european_castle": {
        "unicode": "1F3F0",
        "shortname": ":european_castle:",
        "aliases": "",
        "keywords": "european castle building history royalty castle european residence royalty disneyland disney fort fortified moat tower princess prince lord king queen fortress nobel stronghold"
    },
    "clock12": {
        "unicode": "1F55B",
        "shortname": ":clock12:",
        "aliases": "",
        "keywords": "clock face twelve oclock clock time"
    },
    "white_medium_square": {
        "unicode": "25FB",
        "shortname": ":white_medium_square:",
        "aliases": "",
        "keywords": "white medium square shape"
    },
    "foggy": {
        "unicode": "1F301",
        "shortname": ":foggy:",
        "aliases": "",
        "keywords": "foggy mountain photo bridge weather fog foggy"
    },
    "minidisc": {
        "unicode": "1F4BD",
        "shortname": ":minidisc:",
        "aliases": "",
        "keywords": "minidisc data disc disk record technology"
    },
    "fire_engine": {
        "unicode": "1F692",
        "shortname": ":fire_engine:",
        "aliases": "",
        "keywords": "fire engine cars transportation vehicle fire fighter engine truck emergency medical"
    },
    "clock2": {
        "unicode": "1F551",
        "shortname": ":clock2:",
        "aliases": "",
        "keywords": "clock face two oclock clock time"
    },
    "rice_ball": {
        "unicode": "1F359",
        "shortname": ":rice_ball:",
        "aliases": "",
        "keywords": "rice ball food japanese rice ball white nori seaweed japanese"
    },
    "wind_chime": {
        "unicode": "1F390",
        "shortname": ":wind_chime:",
        "aliases": "",
        "keywords": "wind chime ding nature wind chime bell fūrin instrument music spirits soothing protective spiritual sound"
    },
    "capricorn": {
        "unicode": "2651",
        "shortname": ":capricorn:",
        "aliases": "",
        "keywords": "capricorn capricorn sea-goat goat-horned astrology greek constellation stars zodiac sign sign zodiac horoscope"
    },
    "vs": {"unicode": "1F19A", "shortname": ":vs:", "aliases": "", "keywords": "squared vs orange-square words"},
    "melon": {
        "unicode": "1F348",
        "shortname": ":melon:",
        "aliases": "",
        "keywords": "melon food fruit nature melon cantaloupe honeydew"
    },
    "trumpet": {
        "unicode": "1F3BA",
        "shortname": ":trumpet:",
        "aliases": "",
        "keywords": "trumpet brass music trumpet brass music instrument"
    },
    "school_satchel": {
        "unicode": "1F392",
        "shortname": ":school_satchel:",
        "aliases": "",
        "keywords": "school satchel bag education student school satchel backpack bag packing pack hike education adventure travel sightsee"
    },
    "tokyo_tower": {
        "unicode": "1F5FC",
        "shortname": ":tokyo_tower:",
        "aliases": "",
        "keywords": "tokyo tower japan photo"
    },
    "station": {
        "unicode": "1F689",
        "shortname": ":station:",
        "aliases": "",
        "keywords": "station public transportation vehicle station train subway"
    },
    "end": {
        "unicode": "1F51A",
        "shortname": ":end:",
        "aliases": "",
        "keywords": "end with leftwards arrow above arrow words"
    },
    "bamboo": {
        "unicode": "1F38D",
        "shortname": ":bamboo:",
        "aliases": "",
        "keywords": "pine decoration nature plant vegetable pine bamboo decoration new years spirits harvest prosperity longevity fortune luck welcome farming agriculture"
    },
    "truck": {
        "unicode": "1F69A",
        "shortname": ":truck:",
        "aliases": "",
        "keywords": "delivery truck cars transportation truck delivery package"
    },
    "clock3": {
        "unicode": "1F552",
        "shortname": ":clock3:",
        "aliases": "",
        "keywords": "clock face three oclock clock time"
    },
    "six_pointed_star": {
        "unicode": "1F52F",
        "shortname": ":six_pointed_star:",
        "aliases": "",
        "keywords": "six pointed star with middle dot purple-square"
    },
    "mag_right": {
        "unicode": "1F50E",
        "shortname": ":mag_right:",
        "aliases": "",
        "keywords": "right-pointing magnifying glass search zoom detective investigator detail details"
    },
    "kimono": {
        "unicode": "1F458",
        "shortname": ":kimono:",
        "aliases": "",
        "keywords": "kimono dress fashion female japanese women"
    },
    "railway_car": {
        "unicode": "1F683",
        "shortname": ":railway_car:",
        "aliases": "",
        "keywords": "railway car transportation vehicle railway rail car coach train"
    },
    "crossed_flags": {
        "unicode": "1F38C",
        "shortname": ":crossed_flags:",
        "aliases": "",
        "keywords": "crossed flags japan"
    },
    "sweet_potato": {
        "unicode": "1F360",
        "shortname": ":sweet_potato:",
        "aliases": "",
        "keywords": "roasted sweet potato food nature sweet potato potassium roasted roast"
    },
    "white_small_square": {
        "unicode": "25AB",
        "shortname": ":white_small_square:",
        "aliases": "",
        "keywords": "white small square shape"
    },
    "date": {"unicode": "1F4C5", "shortname": ":date:", "aliases": "", "keywords": "calendar calendar schedule"},
    "newspaper": {
        "unicode": "1F4F0",
        "shortname": ":newspaper:",
        "aliases": "",
        "keywords": "newspaper headline press"
    },
    "no_smoking": {
        "unicode": "1F6AD",
        "shortname": ":no_smoking:",
        "aliases": "",
        "keywords": "no smoking symbol cigarette no smoking cigarette smoke cancer lungs inhale tar nicotine"
    },
    "scroll": {"unicode": "1F4DC", "shortname": ":scroll:", "aliases": "", "keywords": "scroll documents"},
    "flags": {
        "unicode": "1F38F",
        "shortname": ":flags:",
        "aliases": "",
        "keywords": "carp streamer banner carp fish japanese koinobori children kids boys celebration happiness carp streamers japanese holiday flags"
    },
    "mag": {
        "unicode": "1F50D",
        "shortname": ":mag:",
        "aliases": "",
        "keywords": "left-pointing magnifying glass search zoom detective investigator detail details"
    },
    "wheelchair": {
        "unicode": "267F",
        "shortname": ":wheelchair:",
        "aliases": "",
        "keywords": "wheelchair symbol blue-square disabled"
    },
    "sake": {
        "unicode": "1F376",
        "shortname": ":sake:",
        "aliases": "",
        "keywords": "sake bottle and cup beverage drink drunk wine sake wine rice ferment alcohol japanese drink"
    },
    "arrow_up_down": {
        "unicode": "2195",
        "shortname": ":arrow_up_down:",
        "aliases": "",
        "keywords": "up down arrow blue-square"
    },
    "black_large_square": {
        "unicode": "2B1B",
        "shortname": ":black_large_square:",
        "aliases": "",
        "keywords": "black large square shape"
    },
    "wrench": {"unicode": "1F527", "shortname": ":wrench:", "aliases": "", "keywords": "wrench diy ikea tools"},
    "construction": {
        "unicode": "1F6A7",
        "shortname": ":construction:",
        "aliases": "",
        "keywords": "construction sign caution progress wip"
    },
    "calendar": {
        "unicode": "1F4C6",
        "shortname": ":calendar:",
        "aliases": "",
        "keywords": "tear-off calendar schedule"
    },
    "hotel": {
        "unicode": "1F3E8",
        "shortname": ":hotel:",
        "aliases": "",
        "keywords": "hotel accomodation building checkin whotel hotel motel holiday inn hospital"
    },
    "satellite": {
        "unicode": "1F4E1",
        "shortname": ":satellite:",
        "aliases": "",
        "keywords": "satellite antenna communication"
    },
    "rewind": {
        "unicode": "23EA",
        "shortname": ":rewind:",
        "aliases": "",
        "keywords": "black left-pointing double triangle blue-square play"
    },
    "clock4": {
        "unicode": "1F553",
        "shortname": ":clock4:",
        "aliases": "",
        "keywords": "clock face four oclock clock time"
    },
    "circus_tent": {
        "unicode": "1F3AA",
        "shortname": ":circus_tent:",
        "aliases": "",
        "keywords": "circus tent carnival festival party circus tent event carnival big top canvas"
    },
    "link": {"unicode": "1F517", "shortname": ":link:", "aliases": "", "keywords": "link symbol rings url"},
    "bullettrain_side": {
        "unicode": "1F684",
        "shortname": ":bullettrain_side:",
        "aliases": "",
        "keywords": "high-speed train transportation vehicle train bullet rail"
    },
    "mens": {
        "unicode": "1F6B9",
        "shortname": ":mens:",
        "aliases": "",
        "keywords": "mens symbol restroom toilet wc men bathroom restroom sign boy male avatar"
    },
    "carousel_horse": {
        "unicode": "1F3A0",
        "shortname": ":carousel_horse:",
        "aliases": "",
        "keywords": "carousel horse carnival horse photo carousel horse amusement park ride entertainment park fair"
    },
    "ideograph_advantage": {
        "unicode": "1F250",
        "shortname": ":ideograph_advantage:",
        "aliases": "",
        "keywords": "circled ideograph advantage chinese get kanji obtain"
    },
    "atm": {
        "unicode": "1F3E7",
        "shortname": ":atm:",
        "aliases": "",
        "keywords": "automated teller machine atm cash withdrawal money deposit financial bank adam payday bank blue-square cash money payment"
    },
    "vhs": {
        "unicode": "1F4FC",
        "shortname": ":vhs:",
        "aliases": "",
        "keywords": "videocassette oldschool record video"
    },
    "arrow_double_down": {
        "unicode": "23EC",
        "shortname": ":arrow_double_down:",
        "aliases": "",
        "keywords": "black down-pointing double triangle arrow blue-square"
    },
    "clock9": {
        "unicode": "1F558",
        "shortname": ":clock9:",
        "aliases": "",
        "keywords": "clock face nine oclock clock time"
    },
    "blue_book": {
        "unicode": "1F4D8",
        "shortname": ":blue_book:",
        "aliases": "",
        "keywords": "blue book knowledge library read"
    },
    "arrow_heading_up": {
        "unicode": "2934",
        "shortname": ":arrow_heading_up:",
        "aliases": "",
        "keywords": "arrow pointing rightwards then curving upwards arrow blue-square"
    },
    "metro": {
        "unicode": "1F687",
        "shortname": ":metro:",
        "aliases": "",
        "keywords": "metro blue-square mrt transportation tube underground metro subway underground train"
    },
    "clock5": {
        "unicode": "1F554",
        "shortname": ":clock5:",
        "aliases": "",
        "keywords": "clock face five oclock clock time"
    },
    "wc": {
        "unicode": "1F6BE",
        "shortname": ":wc:",
        "aliases": "",
        "keywords": "water closet blue-square restroom toilet water closet toilet bathroom throne porcelain waste flush plumbing"
    },
    "chart_with_upwards_trend": {
        "unicode": "1F4C8",
        "shortname": ":chart_with_upwards_trend:",
        "aliases": "",
        "keywords": "chart with upwards trend graph"
    },
    "slot_machine": {
        "unicode": "1F3B0",
        "shortname": ":slot_machine:",
        "aliases": "",
        "keywords": "slot machine bet gamble vegas slot machine gamble one-armed bandit slots luck"
    },
    "rice_cracker": {
        "unicode": "1F358",
        "shortname": ":rice_cracker:",
        "aliases": "",
        "keywords": "rice cracker food japanese rice cracker seaweed food japanese"
    },
    "page_facing_up": {
        "unicode": "1F4C4",
        "shortname": ":page_facing_up:",
        "aliases": "",
        "keywords": "page facing up documents"
    },
    "arrow_up_small": {
        "unicode": "1F53C",
        "shortname": ":arrow_up_small:",
        "aliases": "",
        "keywords": "up-pointing small red triangle blue-square"
    },
    "green_book": {
        "unicode": "1F4D7",
        "shortname": ":green_book:",
        "aliases": "",
        "keywords": "green book knowledge library read"
    },
    "white_medium_small_square": {
        "unicode": "25FD",
        "shortname": ":white_medium_small_square:",
        "aliases": "",
        "keywords": "white medium small square shape"
    },
    "traffic_light": {
        "unicode": "1F6A5",
        "shortname": ":traffic_light:",
        "aliases": "",
        "keywords": "horizontal traffic light traffic transportation traffic light stop go yield horizontal"
    },
    "clock10": {
        "unicode": "1F559",
        "shortname": ":clock10:",
        "aliases": "",
        "keywords": "clock face ten oclock clock time"
    },
    "convenience_store": {
        "unicode": "1F3EA",
        "shortname": ":convenience_store:",
        "aliases": "",
        "keywords": "convenience store building"
    },
    "paperclip": {
        "unicode": "1F4CE",
        "shortname": ":paperclip:",
        "aliases": "",
        "keywords": "paperclip documents stationery"
    },
    "name_badge": {
        "unicode": "1F4DB",
        "shortname": ":name_badge:",
        "aliases": "",
        "keywords": "name badge fire forbid"
    },
    "clock8": {
        "unicode": "1F557",
        "shortname": ":clock8:",
        "aliases": "",
        "keywords": "clock face eight oclock clock time"
    },
    "arrow_down_small": {
        "unicode": "1F53D",
        "shortname": ":arrow_down_small:",
        "aliases": "",
        "keywords": "down-pointing small red triangle arrow blue-square"
    },
    "clipboard": {
        "unicode": "1F4CB",
        "shortname": ":clipboard:",
        "aliases": "",
        "keywords": "clipboard documents stationery"
    },
    "page_with_curl": {
        "unicode": "1F4C3",
        "shortname": ":page_with_curl:",
        "aliases": "",
        "keywords": "page with curl documents"
    },
    "bookmark_tabs": {
        "unicode": "1F4D1",
        "shortname": ":bookmark_tabs:",
        "aliases": "",
        "keywords": "bookmark tabs favorite"
    },
    "bank": {"unicode": "1F3E6", "shortname": ":bank:", "aliases": "", "keywords": "bank building"},
    "clock11": {
        "unicode": "1F55A",
        "shortname": ":clock11:",
        "aliases": "",
        "keywords": "clock face eleven oclock clock time"
    },
    "e-mail": {
        "unicode": "1F4E7",
        "shortname": ":e-mail:",
        "aliases": ":email:",
        "keywords": "e-mail symbol communication inbox"
    },
    "chart_with_downwards_trend": {
        "unicode": "1F4C9",
        "shortname": ":chart_with_downwards_trend:",
        "aliases": "",
        "keywords": "chart with downwards trend graph"
    },
    "bullettrain_front": {
        "unicode": "1F685",
        "shortname": ":bullettrain_front:",
        "aliases": "",
        "keywords": "high-speed train with bullet nose transportation train bullet rail"
    },
    "bar_chart": {
        "unicode": "1F4CA",
        "shortname": ":bar_chart:",
        "aliases": "",
        "keywords": "bar chart graph presentation stats"
    },
    "notebook_with_decorative_cover": {
        "unicode": "1F4D4",
        "shortname": ":notebook_with_decorative_cover:",
        "aliases": "",
        "keywords": "notebook with decorative cover classroom notes paper record"
    },
    "ticket": {
        "unicode": "1F3AB",
        "shortname": ":ticket:",
        "aliases": "",
        "keywords": "ticket concert event pass ticket show entertainment stub admission proof purchase"
    },
    "information_source": {
        "unicode": "2139",
        "shortname": ":information_source:",
        "aliases": "",
        "keywords": "information source alphabet blue-square letter"
    },
    "pouch": {
        "unicode": "1F45D",
        "shortname": ":pouch:",
        "aliases": "",
        "keywords": "pouch accessories bag pouch bag cosmetic packing grandma makeup"
    },
    "chart": {
        "unicode": "1F4B9",
        "shortname": ":chart:",
        "aliases": "",
        "keywords": "chart with upwards trend and yen sign graph green-square"
    },
    "japanese_castle": {
        "unicode": "1F3EF",
        "shortname": ":japanese_castle:",
        "aliases": "",
        "keywords": "japanese castle building photo castle japanese residence royalty fort fortified fortress"
    },
    "cinema": {
        "unicode": "1F3A6",
        "shortname": ":cinema:",
        "aliases": "",
        "keywords": "cinema blue-square film movie record cinema movie theater motion picture"
    },
    "clock7": {
        "unicode": "1F556",
        "shortname": ":clock7:",
        "aliases": "",
        "keywords": "clock face seven oclock clock time"
    },
    "orange_book": {
        "unicode": "1F4D9",
        "shortname": ":orange_book:",
        "aliases": "",
        "keywords": "orange book knowledge library read"
    },
    "restroom": {
        "unicode": "1F6BB",
        "shortname": ":restroom:",
        "aliases": "",
        "keywords": "restroom blue-square woman man unisex bathroom restroom sign shared toilet"
    },
    "fountain": {"unicode": "26F2", "shortname": ":fountain:", "aliases": "", "keywords": "fountain photo"},
    "clock6": {
        "unicode": "1F555",
        "shortname": ":clock6:",
        "aliases": "",
        "keywords": "clock face six oclock clock time"
    },
    "vibration_mode": {
        "unicode": "1F4F3",
        "shortname": ":vibration_mode:",
        "aliases": "",
        "keywords": "vibration mode orange-square phone"
    },
    "ab": {
        "unicode": "1F18E",
        "shortname": ":ab:",
        "aliases": "",
        "keywords": "negative squared ab alphabet red-square"
    },
    "postbox": {
        "unicode": "1F4EE",
        "shortname": ":postbox:",
        "aliases": "",
        "keywords": "postbox email envelope letter"
    },
    "rice_scene": {
        "unicode": "1F391",
        "shortname": ":rice_scene:",
        "aliases": "",
        "keywords": "moon viewing ceremony photo moon viewing observing otsukimi tsukimi rice scene festival autumn"
    },
    "floppy_disk": {
        "unicode": "1F4BE",
        "shortname": ":floppy_disk:",
        "aliases": "",
        "keywords": "floppy disk oldschool save technology floppy disk storage information computer drive megabyte"
    },
    "parking": {
        "unicode": "1F17F",
        "shortname": ":parking:",
        "aliases": "",
        "keywords": "negative squared latin capital letter p alphabet blue-square cars letter"
    },
    "department_store": {
        "unicode": "1F3EC",
        "shortname": ":department_store:",
        "aliases": "",
        "keywords": "department store building mall shopping department store retail sale merchandise"
    },
    "pager": {"unicode": "1F4DF", "shortname": ":pager:", "aliases": "", "keywords": "pager bbcall oldschool"},
    "currency_exchange": {
        "unicode": "1F4B1",
        "shortname": ":currency_exchange:",
        "aliases": "",
        "keywords": "currency exchange dollar money travel"
    },
    "bookmark": {"unicode": "1F516", "shortname": ":bookmark:", "aliases": "", "keywords": "bookmark favorite"},
    "triangular_ruler": {
        "unicode": "1F4D0",
        "shortname": ":triangular_ruler:",
        "aliases": "",
        "keywords": "triangular ruler architect math sketch stationery"
    },
    "straight_ruler": {
        "unicode": "1F4CF",
        "shortname": ":straight_ruler:",
        "aliases": "",
        "keywords": "straight ruler stationery"
    },
    "japan": {"unicode": "1F5FE", "shortname": ":japan:", "aliases": "", "keywords": "silhouette of japan nation"},
    "flower_playing_cards": {
        "unicode": "1F3B4",
        "shortname": ":flower_playing_cards:",
        "aliases": "",
        "keywords": "flower playing cards playing card flower game august moon special"
    },
    "u5272": {
        "unicode": "1F239",
        "shortname": ":u5272:",
        "aliases": "",
        "keywords": "squared cjk unified ideograph-5272 chinese cut divide kanji pink"
    },
    "fax": {
        "unicode": "1F4E0",
        "shortname": ":fax:",
        "aliases": "",
        "keywords": "fax machine communication technology"
    },
    "izakaya_lantern": {
        "unicode": "1F3EE",
        "shortname": ":izakaya_lantern:",
        "aliases": "",
        "keywords": "izakaya lantern light izakaya lantern stay drink alcohol bar sake restaurant"
    },
    "incoming_envelope": {
        "unicode": "1F4E8",
        "shortname": ":incoming_envelope:",
        "aliases": "",
        "keywords": "incoming envelope email inbox"
    },
    "mailbox": {
        "unicode": "1F4EB",
        "shortname": ":mailbox:",
        "aliases": "",
        "keywords": "closed mailbox with raised flag communication email inbox"
    },
    "lock_with_ink_pen": {
        "unicode": "1F50F",
        "shortname": ":lock_with_ink_pen:",
        "aliases": "",
        "keywords": "lock with ink pen secret security"
    },
    "inbox_tray": {
        "unicode": "1F4E5",
        "shortname": ":inbox_tray:",
        "aliases": "",
        "keywords": "inbox tray documents email"
    },
    "post_office": {
        "unicode": "1F3E3",
        "shortname": ":post_office:",
        "aliases": "",
        "keywords": "japanese post office building communication email"
    },
    "card_index": {
        "unicode": "1F4C7",
        "shortname": ":card_index:",
        "aliases": "",
        "keywords": "card index business stationery"
    },
    "open_file_folder": {
        "unicode": "1F4C2",
        "shortname": ":open_file_folder:",
        "aliases": "",
        "keywords": "open file folder documents load"
    },
    "mahjong": {
        "unicode": "1F004",
        "shortname": ":mahjong:",
        "aliases": "",
        "keywords": "mahjong tile red dragon chinese game kanji"
    },
    "ophiuchus": {
        "unicode": "26CE",
        "shortname": ":ophiuchus:",
        "aliases": "",
        "keywords": "ophiuchus ophiuchus serpent snake astrology greek constellation stars zodiac purple-square sign horoscope"
    },
    "busstop": {
        "unicode": "1F68F",
        "shortname": ":busstop:",
        "aliases": "",
        "keywords": "bus stop transportation bus stop city transport transportation"
    },
    "abc": {
        "unicode": "1F524",
        "shortname": ":abc:",
        "aliases": "",
        "keywords": "input symbol for latin letters alphabet blue-square"
    },
    "u7a7a": {
        "unicode": "1F233",
        "shortname": ":u7a7a:",
        "aliases": "",
        "keywords": "squared cjk unified ideograph-7a7a chinese empty japanese kanji"
    },
    "capital_abcd": {
        "unicode": "1F520",
        "shortname": ":capital_abcd:",
        "aliases": "",
        "keywords": "input symbol for latin capital letters alphabet blue-square words"
    },
    "factory": {"unicode": "1F3ED", "shortname": ":factory:", "aliases": "", "keywords": "factory building"},
    "u7981": {
        "unicode": "1F232",
        "shortname": ":u7981:",
        "aliases": "",
        "keywords": "squared cjk unified ideograph-7981 chinese forbidden japanese kanji limit restricted"
    },
    "u6e80": {
        "unicode": "1F235",
        "shortname": ":u6e80:",
        "aliases": "",
        "keywords": "squared cjk unified ideograph-6e80 chinese full japanese kanji red-square"
    },
    "heavy_division_sign": {
        "unicode": "2797",
        "shortname": ":heavy_division_sign:",
        "aliases": "",
        "keywords": "heavy division sign calculation divide math"
    },
    "file_folder": {
        "unicode": "1F4C1",
        "shortname": ":file_folder:",
        "aliases": "",
        "keywords": "file folder documents"
    },
    "symbols": {
        "unicode": "1F523",
        "shortname": ":symbols:",
        "aliases": "",
        "keywords": "input symbol for symbols blue-square"
    },
    "arrow_double_up": {
        "unicode": "23EB",
        "shortname": ":arrow_double_up:",
        "aliases": "",
        "keywords": "black up-pointing double triangle arrow blue-square"
    },
    "u5408": {
        "unicode": "1F234",
        "shortname": ":u5408:",
        "aliases": "",
        "keywords": "squared cjk unified ideograph-5408 chinese japanese join kanji"
    },
    "u6307": {
        "unicode": "1F22F",
        "shortname": ":u6307:",
        "aliases": "",
        "keywords": "squared cjk unified ideograph-6307 chinese green-square kanji point"
    },
    "abcd": {
        "unicode": "1F521",
        "shortname": ":abcd:",
        "aliases": "",
        "keywords": "input symbol for latin small letters alphabet blue-square"
    },
    "mailbox_closed": {
        "unicode": "1F4EA",
        "shortname": ":mailbox_closed:",
        "aliases": "",
        "keywords": "closed mailbox with lowered flag communication email inbox"
    },
    "outbox_tray": {
        "unicode": "1F4E4",
        "shortname": ":outbox_tray:",
        "aliases": "",
        "keywords": "outbox tray email inbox"
    },
    "u55b6": {
        "unicode": "1F23A",
        "shortname": ":u55b6:",
        "aliases": "",
        "keywords": "squared cjk unified ideograph-55b6 japanese opening hours"
    },
    "u6709": {
        "unicode": "1F236",
        "shortname": ":u6709:",
        "aliases": "",
        "keywords": "squared cjk unified ideograph-6709 chinese have kanji orange-square"
    },
    "accept": {
        "unicode": "1F251",
        "shortname": ":accept:",
        "aliases": "",
        "keywords": "circled ideograph accept agree chinese good kanji ok yes"
    },
    "u7121": {
        "unicode": "1F21A",
        "shortname": ":u7121:",
        "aliases": "",
        "keywords": "squared cjk unified ideograph-7121 chinese japanese kanji no nothing orange-square"
    },
    "koko": {
        "unicode": "1F201",
        "shortname": ":koko:",
        "aliases": "",
        "keywords": "squared katakana koko blue-square destination here japanese katakana"
    },
    "u7533": {
        "unicode": "1F238",
        "shortname": ":u7533:",
        "aliases": "",
        "keywords": "squared cjk unified ideograph-7533 chinese japanese kanji"
    },
    "u6708": {
        "unicode": "1F237",
        "shortname": ":u6708:",
        "aliases": "",
        "keywords": "squared cjk unified ideograph-6708 chinese japanese kanji moon orange-square"
    },
    "hash": {"unicode": "0023-20E3", "shortname": ":hash:", "aliases": "", "keywords": "number sign symbol"},
    "zero": {
        "unicode": "0030-20E3",
        "shortname": ":zero:",
        "aliases": "",
        "keywords": "digit zero blue-square null numbers"
    },
    "one": {"unicode": "0031-20E3", "shortname": ":one:", "aliases": "", "keywords": "digit one 1 blue-square numbers"},
    "two": {
        "unicode": "0032-20E3",
        "shortname": ":two:",
        "aliases": "",
        "keywords": "digit two 2 blue-square numbers prime"
    },
    "three": {
        "unicode": "0033-20E3",
        "shortname": ":three:",
        "aliases": "",
        "keywords": "digit three 3 blue-square numbers prime"
    },
    "four": {
        "unicode": "0034-20E3",
        "shortname": ":four:",
        "aliases": "",
        "keywords": "digit four 4 blue-square numbers"
    },
    "five": {
        "unicode": "0035-20E3",
        "shortname": ":five:",
        "aliases": "",
        "keywords": "digit five blue-square numbers prime"
    },
    "speaker": {
        "unicode": "1F508",
        "shortname": ":speaker:",
        "aliases": "",
        "keywords": "speaker sound listen hear noise"
    },
    "six": {"unicode": "0036-20E3", "shortname": ":six:", "aliases": "", "keywords": "digit six 6 blue-square numbers"},
    "train": {"unicode": "1F68B", "shortname": ":train:", "aliases": "", "keywords": "Tram Car tram rail"},
    "loop": {"unicode": "27BF", "shortname": ":loop:", "aliases": "", "keywords": "double curly loop curly"},
    "seven": {
        "unicode": "0037-20E3",
        "shortname": ":seven:",
        "aliases": "",
        "keywords": "digit seven 7 blue-square numbers prime"
    },
    "eight": {
        "unicode": "0038-20E3",
        "shortname": ":eight:",
        "aliases": "",
        "keywords": "digit eight 8 blue-square numbers"
    },
    "nine": {
        "unicode": "0039-20E3",
        "shortname": ":nine:",
        "aliases": "",
        "keywords": "digit nine 9 blue-square numbers"
    },
    "grinning": {
        "unicode": "1F600",
        "shortname": ":grinning:",
        "aliases": "",
        "keywords": "grinning face face happy joy smile grin grinning smiling smile smiley"
    },
    "innocent": {
        "unicode": "1F607",
        "shortname": ":innocent:",
        "aliases": "",
        "keywords": "smiling face with halo angel face halo halo angel innocent ring circle heaven"
    },
    "smiling_imp": {
        "unicode": "1F608",
        "shortname": ":smiling_imp:",
        "aliases": "",
        "keywords": "smiling face with horns devil horns horns devil impish trouble"
    },
    "ru": {
        "unicode": "1F1F7-1F1FA",
        "shortname": ":ru:",
        "aliases": "",
        "keywords": "russia banner flag nation russian"
    },
    "sunglasses": {
        "unicode": "1F60E",
        "shortname": ":sunglasses:",
        "aliases": "",
        "keywords": "smiling face with sunglasses cool face smiling sunglasses sun glasses sunny cool smooth"
    },
    "neutral_face": {
        "unicode": "1F610",
        "shortname": ":neutral_face:",
        "aliases": "",
        "keywords": "neutral face face indifference neutral objective impartial blank"
    },
    "expressionless": {
        "unicode": "1F611",
        "shortname": ":expressionless:",
        "aliases": "",
        "keywords": "expressionless face expressionless blank void vapid without expression face indifferent"
    },
    "confused": {
        "unicode": "1F615",
        "shortname": ":confused:",
        "aliases": "",
        "keywords": "confused face confused confuse daze perplex puzzle indifference skeptical undecided uneasy hesitant"
    },
    "kissing": {
        "unicode": "1F617",
        "shortname": ":kissing:",
        "aliases": "",
        "keywords": "kissing face 3 face infatuation like love valentines kissing kiss pucker lips smooch"
    },
    "kissing_smiling_eyes": {
        "unicode": "1F619",
        "shortname": ":kissing_smiling_eyes:",
        "aliases": "",
        "keywords": "kissing face with smiling eyes affection face infatuation valentines kissing kiss smile pucker lips smooch"
    },
    "stuck_out_tongue": {
        "unicode": "1F61B",
        "shortname": ":stuck_out_tongue:",
        "aliases": "",
        "keywords": "face with stuck-out tongue childish face mischievous playful prank tongue silly playful cheeky"
    },
    "worried": {
        "unicode": "1F61F",
        "shortname": ":worried:",
        "aliases": "",
        "keywords": "worried face concern face nervous worried anxious distressed nervous tense"
    },
    "frowning": {
        "unicode": "1F626",
        "shortname": ":frowning:",
        "aliases": ":anguished:",
        "keywords": "frowning face with open mouth aw face frown sad pout sulk glower"
    },
    "anguished": {
        "unicode": "1F627",
        "shortname": ":anguished:",
        "aliases": "",
        "keywords": "anguished face face nervous stunned pain anguish ouch misery distress grief"
    },
    "grimacing": {
        "unicode": "1F62C",
        "shortname": ":grimacing:",
        "aliases": "",
        "keywords": "grimacing face face grimace teeth grimace disapprove pain"
    },
    "open_mouth": {
        "unicode": "1F62E",
        "shortname": ":open_mouth:",
        "aliases": "",
        "keywords": "face with open mouth face impressed mouth open jaw gapping surprise wow"
    },
    "hushed": {
        "unicode": "1F62F",
        "shortname": ":hushed:",
        "aliases": "",
        "keywords": "hushed face face woo quiet hush whisper silent"
    },
    "sleeping": {
        "unicode": "1F634",
        "shortname": ":sleeping:",
        "aliases": "",
        "keywords": "sleeping face face sleepy tired sleep sleepy sleeping snore"
    },
    "no_mouth": {
        "unicode": "1F636",
        "shortname": ":no_mouth:",
        "aliases": "",
        "keywords": "face without mouth face hellokitty mouth silent vapid"
    },
    "helicopter": {
        "unicode": "1F681",
        "shortname": ":helicopter:",
        "aliases": "",
        "keywords": "helicopter transportation vehicle helicopter helo gyro gyrocopter"
    },
    "steam_locomotive": {
        "unicode": "1F682",
        "shortname": ":steam_locomotive:",
        "aliases": "",
        "keywords": "steam locomotive train transportation vehicle locomotive steam train engine"
    },
    "train2": {
        "unicode": "1F686",
        "shortname": ":train2:",
        "aliases": "",
        "keywords": "train transportation vehicle train locomotive rail"
    },
    "light_rail": {
        "unicode": "1F688",
        "shortname": ":light_rail:",
        "aliases": "",
        "keywords": "light rail transportation vehicle train rail light"
    },
    "tram": {
        "unicode": "1F68A",
        "shortname": ":tram:",
        "aliases": "",
        "keywords": "tram transportation vehicle tram transportation transport"
    },
    "oncoming_bus": {
        "unicode": "1F68D",
        "shortname": ":oncoming_bus:",
        "aliases": "",
        "keywords": "oncoming bus transportation vehicle bus school city transportation public"
    },
    "trolleybus": {
        "unicode": "1F68E",
        "shortname": ":trolleybus:",
        "aliases": "",
        "keywords": "trolleybus bart transportation vehicle trolley bus city transport transportation"
    },
    "minibus": {
        "unicode": "1F690",
        "shortname": ":minibus:",
        "aliases": "",
        "keywords": "minibus car transportation vehicle bus city transport transportation"
    },
    "oncoming_police_car": {
        "unicode": "1F694",
        "shortname": ":oncoming_police_car:",
        "aliases": "",
        "keywords": "oncoming police car enforcement law vehicle police car emergency ticket citation crime help officer"
    },
    "oncoming_taxi": {
        "unicode": "1F696",
        "shortname": ":oncoming_taxi:",
        "aliases": "",
        "keywords": "oncoming taxi cars uber vehicle taxi car automobile city transport service"
    },
    "oncoming_automobile": {
        "unicode": "1F698",
        "shortname": ":oncoming_automobile:",
        "aliases": "",
        "keywords": "oncoming automobile car transportation vehicle sedan car automobile"
    },
    "articulated_lorry": {
        "unicode": "1F69B",
        "shortname": ":articulated_lorry:",
        "aliases": "",
        "keywords": "articulated lorry cars transportation vehicle truck delivery semi lorry articulated"
    },
    "tractor": {
        "unicode": "1F69C",
        "shortname": ":tractor:",
        "aliases": "",
        "keywords": "tractor agriculture car farming vehicle tractor farm construction machine digger"
    },
    "monorail": {
        "unicode": "1F69D",
        "shortname": ":monorail:",
        "aliases": "",
        "keywords": "monorail transportation vehicle train mono rail transport"
    },
    "mountain_railway": {
        "unicode": "1F69E",
        "shortname": ":mountain_railway:",
        "aliases": "",
        "keywords": "mountain railway transportation mountain railway rail train transport"
    },
    "suspension_railway": {
        "unicode": "1F69F",
        "shortname": ":suspension_railway:",
        "aliases": "",
        "keywords": "suspension railway transportation vehicle suspension railway rail train transportation"
    },
    "mountain_cableway": {
        "unicode": "1F6A0",
        "shortname": ":mountain_cableway:",
        "aliases": "",
        "keywords": "mountain cableway transportation vehicle mountain cable rail train railway"
    },
    "aerial_tramway": {
        "unicode": "1F6A1",
        "shortname": ":aerial_tramway:",
        "aliases": "",
        "keywords": "aerial tramway transportation vehicle aerial tram tramway cable transport"
    },
    "rowboat": {
        "unicode": "1F6A3",
        "shortname": ":rowboat:",
        "aliases": "",
        "keywords": "rowboat hobby ship sports water boat row oar paddle"
    },
    "vertical_traffic_light": {
        "unicode": "1F6A6",
        "shortname": ":vertical_traffic_light:",
        "aliases": "",
        "keywords": "vertical traffic light transportation traffic light stop go yield vertical"
    },
    "put_litter_in_its_place": {
        "unicode": "1F6AE",
        "shortname": ":put_litter_in_its_place:",
        "aliases": "",
        "keywords": "put litter in its place symbol blue-square litter waste trash garbage receptacle can"
    },
    "do_not_litter": {
        "unicode": "1F6AF",
        "shortname": ":do_not_litter:",
        "aliases": "",
        "keywords": "do not litter symbol bin garbage trash litter garbage waste no can trash"
    },
    "potable_water": {
        "unicode": "1F6B0",
        "shortname": ":potable_water:",
        "aliases": "",
        "keywords": "potable water symbol blue-square cleaning faucet liquid restroom potable water drinkable pure clear clean aqua h20"
    },
    "non-potable_water": {
        "unicode": "1F6B1",
        "shortname": ":non-potable_water:",
        "aliases": "",
        "keywords": "non-potable water symbol drink faucet tap non-potable water not drinkable dirty gross aqua h20"
    },
    "no_bicycles": {
        "unicode": "1F6B3",
        "shortname": ":no_bicycles:",
        "aliases": "",
        "keywords": "no bicycles cyclist prohibited bicycle bike pedal no"
    },
    "bicyclist": {
        "unicode": "1F6B4",
        "shortname": ":bicyclist:",
        "aliases": "",
        "keywords": "bicyclist bike exercise hipster sports bicyclist road bike pedal bicycle transportation"
    },
    "mountain_bicyclist": {
        "unicode": "1F6B5",
        "shortname": ":mountain_bicyclist:",
        "aliases": "",
        "keywords": "mountain bicyclist human sports transportation bicyclist mountain bike pedal bicycle transportation"
    },
    "no_pedestrians": {
        "unicode": "1F6B7",
        "shortname": ":no_pedestrians:",
        "aliases": "",
        "keywords": "no pedestrians crossing rules walking no walk pedestrian stroll stride foot feet"
    },
    "children_crossing": {
        "unicode": "1F6B8",
        "shortname": ":children_crossing:",
        "aliases": "",
        "keywords": "children crossing school children kids caution crossing street crosswalk slow"
    },
    "shower": {
        "unicode": "1F6BF",
        "shortname": ":shower:",
        "aliases": "",
        "keywords": "shower bath clean wash bathroom shower soap water clean shampoo lather"
    },
    "bathtub": {
        "unicode": "1F6C1",
        "shortname": ":bathtub:",
        "aliases": "",
        "keywords": "bathtub clean shower bath tub basin wash bubble soak bathroom soap water clean shampoo lather water"
    },
    "passport_control": {
        "unicode": "1F6C2",
        "shortname": ":passport_control:",
        "aliases": "",
        "keywords": "passport control blue-square custom passport official travel control foreign identification"
    },
    "customs": {
        "unicode": "1F6C3",
        "shortname": ":customs:",
        "aliases": "",
        "keywords": "customs border passport customs travel foreign goods check authority government"
    },
    "baggage_claim": {
        "unicode": "1F6C4",
        "shortname": ":baggage_claim:",
        "aliases": "",
        "keywords": "baggage claim airport blue-square transport bag baggage luggage travel"
    },
    "left_luggage": {
        "unicode": "1F6C5",
        "shortname": ":left_luggage:",
        "aliases": "",
        "keywords": "left luggage blue-square travel bag baggage luggage travel"
    },
    "earth_africa": {
        "unicode": "1F30D",
        "shortname": ":earth_africa:",
        "aliases": "",
        "keywords": "earth globe europe-africa globe international world earth globe space planet africa europe home"
    },
    "earth_americas": {
        "unicode": "1F30E",
        "shortname": ":earth_americas:",
        "aliases": "",
        "keywords": "earth globe americas USA globe international world earth globe space planet north south america americas home"
    },
    "globe_with_meridians": {
        "unicode": "1F310",
        "shortname": ":globe_with_meridians:",
        "aliases": "",
        "keywords": "globe with meridians earth international world earth meridian globe space planet home"
    },
    "waxing_crescent_moon": {
        "unicode": "1F312",
        "shortname": ":waxing_crescent_moon:",
        "aliases": "",
        "keywords": "waxing crescent moon symbol nature moon waxing sky night cheese phase"
    },
    "waning_gibbous_moon": {
        "unicode": "1F316",
        "shortname": ":waning_gibbous_moon:",
        "aliases": "",
        "keywords": "waning gibbous moon symbol nature moon waning gibbous sky night cheese phase"
    },
    "last_quarter_moon": {
        "unicode": "1F317",
        "shortname": ":last_quarter_moon:",
        "aliases": "",
        "keywords": "last quarter moon symbol nature moon last quarter sky night cheese phase"
    },
    "waning_crescent_moon": {
        "unicode": "1F318",
        "shortname": ":waning_crescent_moon:",
        "aliases": "",
        "keywords": "waning crescent moon symbol nature moon crescent waning sky night cheese phase"
    },
    "new_moon_with_face": {
        "unicode": "1F31A",
        "shortname": ":new_moon_with_face:",
        "aliases": "",
        "keywords": "new moon with face nature moon new anthropomorphic face sky night cheese phase"
    },
    "last_quarter_moon_with_face": {
        "unicode": "1F31C",
        "shortname": ":last_quarter_moon_with_face:",
        "aliases": "",
        "keywords": "last quarter moon with face nature moon last quarter anthropomorphic face sky night cheese phase"
    },
    "full_moon_with_face": {
        "unicode": "1F31D",
        "shortname": ":full_moon_with_face:",
        "aliases": "",
        "keywords": "full moon with face night moon full anthropomorphic face sky night cheese phase spooky werewolves monsters"
    },
    "sun_with_face": {
        "unicode": "1F31E",
        "shortname": ":sun_with_face:",
        "aliases": "",
        "keywords": "sun with face morning sun anthropomorphic face sky"
    },
    "evergreen_tree": {
        "unicode": "1F332",
        "shortname": ":evergreen_tree:",
        "aliases": "",
        "keywords": "evergreen tree nature plant evergreen tree needles christmas"
    },
    "deciduous_tree": {
        "unicode": "1F333",
        "shortname": ":deciduous_tree:",
        "aliases": "",
        "keywords": "deciduous tree nature plant deciduous tree leaves fall color"
    },
    "lemon": {
        "unicode": "1F34B",
        "shortname": ":lemon:",
        "aliases": "",
        "keywords": "lemon fruit nature lemon yellow citrus"
    },
    "pear": {
        "unicode": "1F350",
        "shortname": ":pear:",
        "aliases": "",
        "keywords": "pear fruit nature pear fruit shape"
    },
    "baby_bottle": {
        "unicode": "1F37C",
        "shortname": ":baby_bottle:",
        "aliases": "",
        "keywords": "baby bottle container food baby bottle milk mother nipple newborn formula"
    },
    "horse_racing": {
        "unicode": "1F3C7",
        "shortname": ":horse_racing:",
        "aliases": "",
        "keywords": "horse racing animal betting competition horse race racing jockey triple crown"
    },
    "rugby_football": {
        "unicode": "1F3C9",
        "shortname": ":rugby_football:",
        "aliases": "",
        "keywords": "rugby football sports rugby football ball sport team england"
    },
    "european_post_office": {
        "unicode": "1F3E4",
        "shortname": ":european_post_office:",
        "aliases": "",
        "keywords": "european post office building"
    },
    "rat": {
        "unicode": "1F400",
        "shortname": ":rat:",
        "aliases": "",
        "keywords": "rat animal mouse rat rodent crooked snitch"
    },
    "mouse2": {
        "unicode": "1F401",
        "shortname": ":mouse2:",
        "aliases": "",
        "keywords": "mouse animal nature mouse mice rodent"
    },
    "ox": {"unicode": "1F402", "shortname": ":ox:", "aliases": "", "keywords": "ox animal beef cow"},
    "water_buffalo": {
        "unicode": "1F403",
        "shortname": ":water_buffalo:",
        "aliases": "",
        "keywords": "water buffalo animal cow nature ox water buffalo asia bovine milk dairy"
    },
    "cow2": {
        "unicode": "1F404",
        "shortname": ":cow2:",
        "aliases": "",
        "keywords": "cow animal beef nature ox cow milk dairy beef bessie moo"
    },
    "tiger2": {
        "unicode": "1F405",
        "shortname": ":tiger2:",
        "aliases": "",
        "keywords": "tiger animal nature tiger cat striped tony tigger hobs"
    },
    "leopard": {
        "unicode": "1F406",
        "shortname": ":leopard:",
        "aliases": "",
        "keywords": "leopard animal nature leopard cat spot spotted sexy"
    },
    "rabbit2": {
        "unicode": "1F407",
        "shortname": ":rabbit2:",
        "aliases": "",
        "keywords": "rabbit animal nature rabbit bunny easter reproduction prolific"
    },
    "cat2": {
        "unicode": "1F408",
        "shortname": ":cat2:",
        "aliases": "",
        "keywords": "cat animal meow pet cat kitten meow"
    },
    "dragon": {
        "unicode": "1F409",
        "shortname": ":dragon:",
        "aliases": "",
        "keywords": "dragon animal chinese green myth nature dragon fire legendary myth"
    },
    "crocodile": {
        "unicode": "1F40A",
        "shortname": ":crocodile:",
        "aliases": "",
        "keywords": "crocodile animal nature crocodile croc alligator gator cranky"
    },
    "whale2": {
        "unicode": "1F40B",
        "shortname": ":whale2:",
        "aliases": "",
        "keywords": "whale animal nature ocean sea whale blubber bloated fat large massive"
    },
    "ram": {
        "unicode": "1F40F",
        "shortname": ":ram:",
        "aliases": "",
        "keywords": "ram animal nature sheep ram sheep male horn horns"
    },
    "goat": {
        "unicode": "1F410",
        "shortname": ":goat:",
        "aliases": "",
        "keywords": "goat animal nature goat sheep kid billy livestock"
    },
    "rooster": {
        "unicode": "1F413",
        "shortname": ":rooster:",
        "aliases": "",
        "keywords": "rooster animal chicken nature rooster cockerel cock male cock-a-doodle-doo crowing"
    },
    "dog2": {
        "unicode": "1F415",
        "shortname": ":dog2:",
        "aliases": "",
        "keywords": "dog animal doge friend nature pet dog puppy pet friend woof bark fido"
    },
    "pig2": {
        "unicode": "1F416",
        "shortname": ":pig2:",
        "aliases": "",
        "keywords": "pig animal nature pig piggy pork ham hog bacon oink slop livestock greed greedy"
    },
    "dromedary_camel": {
        "unicode": "1F42A",
        "shortname": ":dromedary_camel:",
        "aliases": "",
        "keywords": "dromedary camel animal desert hot dromedary camel hump desert middle east heat hot water hump day wednesday sex"
    },
    "busts_in_silhouette": {
        "unicode": "1F465",
        "shortname": ":busts_in_silhouette:",
        "aliases": "",
        "keywords": "busts in silhouette group human man person team user silhouette silhouettes people user members accounts relationship shadow"
    },
    "two_men_holding_hands": {
        "unicode": "1F46C",
        "shortname": ":two_men_holding_hands:",
        "aliases": "",
        "keywords": "two men holding hands bromance couple friends like love men gay homosexual friends hands holding team unity"
    },
    "two_women_holding_hands": {
        "unicode": "1F46D",
        "shortname": ":two_women_holding_hands:",
        "aliases": "",
        "keywords": "two women holding hands couple female friends like love women hands girlfriends friends sisters mother daughter gay homosexual couple unity"
    },
    "thought_balloon": {
        "unicode": "1F4AD",
        "shortname": ":thought_balloon:",
        "aliases": "",
        "keywords": "thought balloon bubble cloud speech thought balloon comic think day dream wonder"
    },
    "euro": {
        "unicode": "1F4B6",
        "shortname": ":euro:",
        "aliases": "",
        "keywords": "banknote with euro sign currency dollar money euro europe banknote money currency paper cash bills"
    },
    "pound": {
        "unicode": "1F4B7",
        "shortname": ":pound:",
        "aliases": "",
        "keywords": "banknote with pound sign bills british currency england money sterling uk pound britain british banknote money currency paper cash bills"
    },
    "mailbox_with_mail": {
        "unicode": "1F4EC",
        "shortname": ":mailbox_with_mail:",
        "aliases": "",
        "keywords": "open mailbox with raised flag communication email inbox"
    },
    "mailbox_with_no_mail": {
        "unicode": "1F4ED",
        "shortname": ":mailbox_with_no_mail:",
        "aliases": "",
        "keywords": "open mailbox with lowered flag email inbox"
    },
    "postal_horn": {
        "unicode": "1F4EF",
        "shortname": ":postal_horn:",
        "aliases": "",
        "keywords": "postal horn instrument music"
    },
    "no_mobile_phones": {
        "unicode": "1F4F5",
        "shortname": ":no_mobile_phones:",
        "aliases": "",
        "keywords": "no mobile phones iphone mute"
    },
    "twisted_rightwards_arrows": {
        "unicode": "1F500",
        "shortname": ":twisted_rightwards_arrows:",
        "aliases": "",
        "keywords": "twisted rightwards arrows blue-square"
    },
    "repeat": {
        "unicode": "1F501",
        "shortname": ":repeat:",
        "aliases": "",
        "keywords": "clockwise rightwards and leftwards open circle arr loop record"
    },
    "repeat_one": {
        "unicode": "1F502",
        "shortname": ":repeat_one:",
        "aliases": "",
        "keywords": "clockwise rightwards and leftwards open circle arr blue-square loop"
    },
    "arrows_counterclockwise": {
        "unicode": "1F504",
        "shortname": ":arrows_counterclockwise:",
        "aliases": "",
        "keywords": "anticlockwise downwards and upwards open circle ar blue-square sync"
    },
    "low_brightness": {
        "unicode": "1F505",
        "shortname": ":low_brightness:",
        "aliases": "",
        "keywords": "low brightness symbol summer sun"
    },
    "high_brightness": {
        "unicode": "1F506",
        "shortname": ":high_brightness:",
        "aliases": "",
        "keywords": "high brightness symbol light summer sun"
    },
    "mute": {
        "unicode": "1F507",
        "shortname": ":mute:",
        "aliases": "",
        "keywords": "speaker with cancellation stroke sound volume"
    },
    "sound": {
        "unicode": "1F509",
        "shortname": ":sound:",
        "aliases": "",
        "keywords": "speaker with one sound wave speaker volume"
    },
    "no_bell": {
        "unicode": "1F515",
        "shortname": ":no_bell:",
        "aliases": "",
        "keywords": "bell with cancellation stroke mute sound volume"
    },
    "microscope": {
        "unicode": "1F52C",
        "shortname": ":microscope:",
        "aliases": "",
        "keywords": "microscope experiment laboratory zoomin"
    },
    "telescope": {"unicode": "1F52D", "shortname": ":telescope:", "aliases": "", "keywords": "telescope space stars"},
    "clock130": {
        "unicode": "1F55C",
        "shortname": ":clock130:",
        "aliases": "",
        "keywords": "clock face one-thirty clock time"
    },
    "clock230": {
        "unicode": "1F55D",
        "shortname": ":clock230:",
        "aliases": "",
        "keywords": "clock face two-thirty clock time"
    },
    "clock330": {
        "unicode": "1F55E",
        "shortname": ":clock330:",
        "aliases": "",
        "keywords": "clock face three-thirty clock time"
    },
    "clock430": {
        "unicode": "1F55F",
        "shortname": ":clock430:",
        "aliases": "",
        "keywords": "clock face four-thirty clock time"
    },
    "clock530": {
        "unicode": "1F560",
        "shortname": ":clock530:",
        "aliases": "",
        "keywords": "clock face five-thirty clock time"
    },
    "clock630": {
        "unicode": "1F561",
        "shortname": ":clock630:",
        "aliases": "",
        "keywords": "clock face six-thirty clock time"
    },
    "clock730": {
        "unicode": "1F562",
        "shortname": ":clock730:",
        "aliases": "",
        "keywords": "clock face seven-thirty clock time"
    },
    "clock830": {
        "unicode": "1F563",
        "shortname": ":clock830:",
        "aliases": "",
        "keywords": "clock face eight-thirty clock time"
    },
    "clock930": {
        "unicode": "1F564",
        "shortname": ":clock930:",
        "aliases": "",
        "keywords": "clock face nine-thirty clock time"
    },
    "clock1030": {
        "unicode": "1F565",
        "shortname": ":clock1030:",
        "aliases": "",
        "keywords": "clock face ten-thirty clock time"
    },
    "clock1130": {
        "unicode": "1F566",
        "shortname": ":clock1130:",
        "aliases": "",
        "keywords": "clock face eleven-thirty clock time"
    },
    "clock1230": {
        "unicode": "1F567",
        "shortname": ":clock1230:",
        "aliases": "",
        "keywords": "clock face twelve-thirty clock time"
    }
};
 