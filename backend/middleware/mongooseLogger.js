import mongoose from 'mongoose';

/**
 * Middleware global de Mongoose para loguear todas las operaciones de modificación
 * en la colección de proyectos
 */
export function setupMongooseLogging() {
  // Hook global ANTES de cualquier actualización
  mongoose.plugin((schema, options) => {
    // Pre-save hook
    schema.pre('save', function(next) {
      if (this.constructor.modelName === 'Project') {
        console.log('🔧 PRE-SAVE Project:', {
          id: this._id,
          name: this.name,
          membersCount: this.members?.length,
          operation: this.isNew ? 'CREATE' : 'UPDATE',
          stack: new Error().stack.split('\n').slice(2, 5).join('\n')
        });
      }
      next();
    });

    // Post-save hook
    schema.post('save', function(doc) {
      if (this.constructor.modelName === 'Project') {
        console.log('✅ POST-SAVE Project:', {
          id: doc._id,
          name: doc.name,
          membersCount: doc.members?.length
        });
      }
    });

    // Pre-update hooks
    schema.pre('findOneAndUpdate', function(next) {
      if (this.model.modelName === 'Project') {
        console.log('🔧 PRE-UPDATE Project (findOneAndUpdate):', {
          filter: this.getFilter(),
          update: this.getUpdate(),
          stack: new Error().stack.split('\n').slice(2, 5).join('\n')
        });
      }
      next();
    });

    schema.pre('updateOne', function(next) {
      if (this.model.modelName === 'Project') {
        console.log('🔧 PRE-UPDATE Project (updateOne):', {
          filter: this.getFilter(),
          update: this.getUpdate(),
          stack: new Error().stack.split('\n').slice(2, 5).join('\n')
        });
      }
      next();
    });

    schema.pre('updateMany', function(next) {
      if (this.model.modelName === 'Project') {
        console.log('🔧 PRE-UPDATE Project (updateMany):', {
          filter: this.getFilter(),
          update: this.getUpdate(),
          stack: new Error().stack.split('\n').slice(2, 5).join('\n')
        });
      }
      next();
    });

    // Pre-delete hooks
    schema.pre('deleteOne', function(next) {
      if (this.model.modelName === 'Project') {
        console.log('🗑️ PRE-DELETE Project (deleteOne):', {
          filter: this.getFilter(),
          stack: new Error().stack.split('\n').slice(2, 5).join('\n')
        });
      }
      next();
    });

    schema.pre('findOneAndDelete', function(next) {
      if (this.model.modelName === 'Project') {
        console.log('🗑️ PRE-DELETE Project (findOneAndDelete):', {
          filter: this.getFilter(),
          stack: new Error().stack.split('\n').slice(2, 5).join('\n')
        });
      }
      next();
    });
  });

  console.log('✅ Mongoose logging middleware instalado');
}
