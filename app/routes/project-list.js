import Route from '@ember/routing/route';

export default Route.extend({
    model: function() {
        return this.store.findAll('project').then(results => results.sortBy("popularity").reverse());
    },

    model_retrieve(params) {
        return this.store.findRecord('project', params.id);
    },

    actions: {
        updateTask(task) {
          task.save();
        }
      }

});
