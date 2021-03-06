import Controller from '@ember/controller';
import { w } from '@ember/string';
import Wordnik from 'npm:wordnik';

// Keepign these here for now. We may utilzie them later.
var projects = {
  share: [
    'photos', 'links', 'gifs', 'reviews', 'stories', 'questions', 'tweets',
    'contacts', 'favorites', 'decisions', 'poems', 'location',
  ],
  of: ['food', 'family', 'pets', 'celebrities', 'books', 'music', 'movies', 'other people', 'yourself', 'travel', 'jokes', 'businesses', 'aliens' ],
  with: ['classmates', 'professors', 'friends', 'strangers', 'potential mates',
    'communities of interest', 'editors', 'the public', 'pet owners',
    'myself', 'your significant other', 'parents', 'family', 'politicians',
    'government', 'co-workers', 'frenemies', 'stores', 'your mechanic',
    'your doctor', 'your lawyer', 'your banker',
  ],
  by: ['commenting', 'voting', 'upvoting or downvoting', 'liking', 'buying',
    'editing', 'bargaining', 'contacting', 'viewing', 'rating',
    'sharing on social media', 'organizing', 'publicizing', 'publishing',
    'retracting', 'polling', 'reviewing', 'defacing', 'forwarding'
  ],
  reason: ['fame', 'money', 'snark', 'mockery', 'karma points', 'attention',
    'enjoy', 'laugh', 'motivate', 'vent', 'promote', 'create community',
    'influence perception', 'develop brand', 'express anger',
    'be creative', 'blind following', 'self-involvement', 'coordinate',
    'alleviate boredom', 'create knowledge', 'share expertise',
  ]
};

export default Controller.extend({
  isDisabled: false,
  error_message: null,
  result_id: "",
  speechType1: 'noun',
  speechType2: 'noun',
  speechType3: 'noun',
  speechType4: 'verb',
  speechType5: 'noun',
  speechTypes: w('verb noun adjective adverb'),
  nprojects: 10,
  actions: {
    toggleDisable: function() { this.toggleProperty('isDisabled');},
    generateProject() {
      // how many projects to generated. Can change this to a form input value or something.
      var nprojects = this.nprojects;

      if(!(0 < nprojects && nprojects <= 20)) {
        this.set('error_message','Invalid quantity - Select 1-20 project generations');
        this.toggleProperty('isDisabled');
        return;
      }

      // Update word list to change what words are generated. word 1 is noun, word 2 is noun, etc.
      var word_type_list = [this.speechType1, this.speechType2, this.speechType3, this.speechType4,this.speechType5];
      var wn = new Wordnik({
          api_key: 'a659446027b16f24960073f46c1c4e9c4333f7c699a757cb3'
      });

      // Create new result object.
      var newResult = this.store.createRecord('result');
      newResult.set('timestamp', new Date());
      newResult.save();


      // Keep a list of promises. Each promise will be generating a project
      var promises = [];

      // Generate n number of projects
      for (var i = 0; i < nprojects; i++) {
        promises.push(new Promise(function(resolve, reject){

          // Time to get edgey, keep a list of our inner promises - Each promise generates a single word.
          var inner_promises = [];
          for (var j = 0; j < 5; j++) {
            inner_promises.push(
              new Promise(function(resolve, reject){

                // Get a random word from wordnik
                wn.randomWord(
                  {
                    // We can probably enhance these query parameters to get better results
                    useCanonical: true,
                    includeSuggestions: true,
                    hasDictionaryDef: true,
                    maxDictionaryCount: 1,
                    includePartOfSpeech: word_type_list[j]
                  },
                  function(error, word,) {
                    // Fullfil our promise. Reject if error, or resolve promise.
                    if(error) {
                      reject(error)
                    } else {
                      resolve(word.word);
                    }
                  })
                })
            );
          }

          // Wait for all our inner promises to complete.
          Promise.all(inner_promises).then(function(values) {
            // all success - values is a list of resolved promise return values from inner promises

            // Create new project
            var newProject = this.store.createRecord('project', {
              results: newResult,
              share: values[0],
              of: values[1],
              with: values[2],
              by: values[3],
              reason: values[4],
              popularity: 1
            });

            // Save it and associate it with the result
            newProject.save().then(function(){newResult.save();});

            // Result object  has a list of projects. Add this project to it
            newResult.get('projects').addObject(newProject);
            newResult.save();
                  // alert with generated project

            // Resolve this project promise.
            resolve(newProject);

          }.bind(this), function(error) {

            // inner_promises had an error. Reject this project promise with reason.
            reject(error);

          }.bind(this));  // end promise.all(inner_promises)
        }.bind(this)));
      }

      // Promise all for all 10 project promises
      Promise.all(promises).then(function() {
        // All promises have completed.
        // The projects have been saved
        // the result has been saved
        //
        // ----Alternatively:
        //  We can generate all the projects, return them here (we already do this, they're in values),
        //  and then create the result object to attach them to. Then save the projects and the result all at once.

        this.set('result_id', newResult.get('id'));
        this.transitionToRoute('result', newResult);
        this.toggleProperty('isDisabled');
      }.bind(this), function() {
        // error occurred, at least one project creation failed.
        // we can chose to either keep the result with missing projects or throw it out all together.
        this.set('error_message','Failed to generate the projets');
        this.toggleProperty('isDisabled');
      }.bind(this));
    },//END-OF:: generateProject
    generateLegacyProject() {
      // how many projects to generated. Can change this to a form input value or something.
      var nprojects = this.nprojects;

      if(!(0 < nprojects && nprojects <= 20)) {
        this.set('error_message','Invalid quantity - Select 1-20 project generations');
        this.toggleProperty('isDisabled');
        return;
      }

      // Create new result object.
      var newResult = this.store.createRecord('result');
      newResult.set('timestamp', new Date());
      newResult.save();


      // Keep a list of promises. Each promise will be generating a project
      var promises = [];

      // Generate n number of projects
      for (var i = 0; i < nprojects; i++) {
        promises.push(new Promise(function(resolve){
          var rShare = projects.share[Math.floor(Math.random() * projects.share.length)];
          var rOf = projects.of[Math.floor(Math.random() * projects.of.length)];
          var rWith = projects.with[Math.floor(Math.random() * projects.with.length)];
          var rBy = projects.by[Math.floor(Math.random() * projects.by.length)];
          var rReason = projects.reason[Math.floor(Math.random() * projects.reason.length)];

          // Create new project
          var newProject = this.store.createRecord('project', {
            results: newResult,
            share: rShare,
            of: rOf,
            with: rWith,
            by: rBy,
            reason: rReason,
            popularity: 1
          });

          // Save it and associate it with the result
          newProject.save().then(function(){newResult.save();});

          // Result object  has a list of projects. Add this project to it
          newResult.get('projects').addObject(newProject);
          newResult.save();
          // Resolve this project promise.
          resolve(newProject);

        }.bind(this)));
      }

      // Promise all for all 10 project promises
      Promise.all(promises).then(function() {
        // All promises have completed.
        // The projects have been saved
        // the result has been saved
        //
        // ----Alternatively:
        //  We can generate all the projects, return them here (we already do this, they're in values),
        //  and then create the result object to attach them to. Then save the projects and the result all at once.

        this.set('result_id', newResult.get('id'));
        this.transitionToRoute('result', newResult);
        this.toggleProperty('isDisabled');
      }.bind(this), function() {
        // error occurred, at least one project creation failed.
        // we can chose to either keep the result with missing projects or throw it out all together.
        this.set('error_message','Failed to generate the projets');
        this.toggleProperty('isDisabled');
      }.bind(this));
    }//END-OF:: generateProject
  }
});
